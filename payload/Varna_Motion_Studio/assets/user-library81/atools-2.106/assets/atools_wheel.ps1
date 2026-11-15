<#
  ATOOLS Radial - global wheel helper.

  A CEP panel cannot see the mouse outside its own window and cannot draw over
  After Effects, so this helper does both:
    * a low-level mouse hook watches for a held right button while AE is the
      foreground application, and Ctrl+Alt+W (a system hotkey) opens the same
      wheel without holding anything: left click picks, Esc / right / middle cancel,
    * a layered click-through top-most window paints the wheel at the cursor,
    * the chosen command is handed back to the panel through a text file.

  Everything lives in one folder, handed in as -Dir:
    wheel.cfg  written by the panel  - the layout to draw
    cmd.txt    written here          - the command the panel should run
    pid.txt    written here          - so the panel knows we are alive
    stop.txt   written by the panel  - tells us to quit
    log.txt    written here          - diagnostics
#>
param(
  [Parameter(Mandatory=$true)][string]$Dir,
  [switch]$SelfTest
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# This has to happen before any window exists.
# PowerShell 5.1 is DPI-UNAWARE, so on a scaled display Windows hands it a
# virtualised desktop: on a 3840x2160 screen at 150% it sees 2560x1440. The
# low-level mouse hook, on the other hand, always reports PHYSICAL pixels.
# Mixing the two put the wheel at 1.5x the cursor's distance from the top-left
# corner, stretched and blurred, with hit radii to match. Declaring per-monitor
# awareness puts every coordinate in one space.
Add-Type -TypeDefinition @"
using System;using System.Runtime.InteropServices;
public static class AtoolsDpi{
  [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr v);
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
  public static string Apply(){
    try{ if(SetProcessDpiAwarenessContext(new IntPtr(-4))) return "per-monitor-v2"; }catch{}
    try{ if(SetProcessDPIAware()) return "system"; }catch{}
    return "none";
  }
}
"@
$dpiMode = [AtoolsDpi]::Apply()

$cs = @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace AtoolsWheel
{
    public class Tool { public string N = ""; public string Cmd = ""; }

    public class Seg
    {
        public string Name = "";
        public Color Col = Color.FromArgb(59, 143, 220);
        public List<Tool> Tools = new List<Tool>();
    }

    public class Cfg
    {
        public int HoldMs = 2000;
        public int R = 190;                 // disc radius in pixels
        public bool AnyApp = false;          // debug: react outside After Effects too
        public List<Seg> Segs = new List<Seg>();

        public static Cfg Load(string path)
        {
            Cfg c = new Cfg();
            if (!File.Exists(path)) return c;
            Seg cur = null;
            foreach (string raw in File.ReadAllLines(path))
            {
                string line = raw.Trim();
                if (line.Length == 0) continue;
                string[] p = line.Split('|');
                if (p[0] == "HOLD" && p.Length > 1) { int v; if (int.TryParse(p[1], out v)) c.HoldMs = v; }
                else if (p[0] == "SIZE" && p.Length > 1) { int v; if (int.TryParse(p[1], out v)) c.R = v; }
                else if (p[0] == "ANYAPP" && p.Length > 1) { c.AnyApp = (p[1] == "1"); }
                else if (p[0] == "SEG" && p.Length > 2)
                {
                    cur = new Seg();
                    cur.Name = p[1];
                    cur.Col = ParseColor(p[2]);
                    c.Segs.Add(cur);
                }
                else if (p[0] == "TOOL" && p.Length > 2 && cur != null)
                {
                    Tool t = new Tool();
                    t.N = p[1];
                    t.Cmd = p[2];
                    cur.Tools.Add(t);
                }
            }
            return c;
        }

        static Color ParseColor(string hex)
        {
            try
            {
                hex = hex.Replace("#", "");
                int r = Convert.ToInt32(hex.Substring(0, 2), 16);
                int g = Convert.ToInt32(hex.Substring(2, 2), 16);
                int b = Convert.ToInt32(hex.Substring(4, 2), 16);
                return Color.FromArgb(r, g, b);
            }
            catch { return Color.FromArgb(59, 143, 220); }
        }
    }

    public class Overlay : Form
    {
        // ---------- win32 ----------
        const int WH_MOUSE_LL = 14;
        const int WM_RBUTTONDOWN = 0x0204, WM_RBUTTONUP = 0x0205, WM_MOUSEMOVE = 0x0200;
        const int WM_LBUTTONDOWN = 0x0201, WM_LBUTTONUP = 0x0202, WM_MBUTTONDOWN = 0x0207, WM_MBUTTONUP = 0x0208;
        // hotkey summon: Ctrl+Alt+W opens the wheel without holding any mouse button
        // (18.09.2026 it became Alt+W; 06.10.2026 the owner put Ctrl+Alt+W back)
        const int WM_HOTKEY = 0x0312;
        const uint MOD_ALT = 0x0001, MOD_CONTROL = 0x0002, MOD_NOREPEAT = 0x4000;
        const uint VK_W = 0x57, VK_ESCAPE = 0x1B;
        const int HK_SUMMON = 1, HK_ESC = 2, HK_ESC_ALT = 3, HK_ESC_CA = 4;
        const uint MOD_SUMMON = MOD_CONTROL | MOD_ALT;
        const int WS_EX_LAYERED = 0x00080000, WS_EX_TRANSPARENT = 0x00000020;
        const int WS_EX_TOOLWINDOW = 0x00000080, WS_EX_NOACTIVATE = 0x08000000, WS_EX_TOPMOST = 0x00000008;
        const int ULW_ALPHA = 2;
        const uint MOUSEEVENTF_RIGHTDOWN = 0x0008, MOUSEEVENTF_RIGHTUP = 0x0010;
        const uint SIGNATURE = 0xA700157;      // marks the clicks we re-inject

        delegate IntPtr HookProc(int nCode, IntPtr wParam, IntPtr lParam);

        [StructLayout(LayoutKind.Sequential)]
        struct MSLLHOOKSTRUCT { public int x; public int y; public uint mouseData; public uint flags; public uint time; public UIntPtr dwExtraInfo; }
        [StructLayout(LayoutKind.Sequential)] struct POINT { public int x; public int y; }
        [StructLayout(LayoutKind.Sequential)] struct SIZE { public int cx; public int cy; }
        [StructLayout(LayoutKind.Sequential)]
        struct BLENDFUNCTION { public byte BlendOp, BlendFlags, SourceConstantAlpha, AlphaFormat; }

        [DllImport("user32.dll", SetLastError = true)] static extern IntPtr SetWindowsHookEx(int id, HookProc fn, IntPtr mod, uint thread);
        [DllImport("user32.dll", SetLastError = true)] static extern bool UnhookWindowsHookEx(IntPtr hhk);
        // used by the watchdog: an exit route that does not need the message pump
        [DllImport("kernel32.dll")] static extern IntPtr GetCurrentProcess();
        [DllImport("kernel32.dll")] static extern bool TerminateProcess(IntPtr h, uint code);
        [DllImport("user32.dll")] static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);
        [DllImport("kernel32.dll")] static extern IntPtr GetModuleHandle(string name);
        [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
        [DllImport("user32.dll")] static extern bool GetCursorPos(out POINT p);
        [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
        [DllImport("user32.dll")] static extern IntPtr GetDC(IntPtr h);
        [DllImport("user32.dll")] static extern int ReleaseDC(IntPtr h, IntPtr dc);
        [DllImport("gdi32.dll")] static extern IntPtr CreateCompatibleDC(IntPtr dc);
        [DllImport("gdi32.dll")] static extern IntPtr SelectObject(IntPtr dc, IntPtr obj);
        [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr obj);
        [DllImport("gdi32.dll")] static extern bool DeleteDC(IntPtr dc);
        [DllImport("user32.dll")] static extern bool UpdateLayeredWindow(IntPtr h, IntPtr dstDC, ref POINT dstPt, ref SIZE sz, IntPtr srcDC, ref POINT srcPt, int key, ref BLENDFUNCTION bf, int flags);
        [DllImport("user32.dll")] static extern void mouse_event(uint flags, int dx, int dy, uint data, UIntPtr extra);
        [DllImport("user32.dll", SetLastError = true)] static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);
        [DllImport("user32.dll", SetLastError = true)] static extern bool UnregisterHotKey(IntPtr hWnd, int id);
        [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
        [DllImport("user32.dll")] static extern short GetAsyncKeyState(int vk);

        // ---------- state ----------
        string dir;
        Cfg cfg;
        IntPtr hook = IntPtr.Zero;
        HookProc proc;                       // kept alive on purpose
        Timer tick;

        bool rDown = false, shown = false, swallowing = false;
        // hotMode: the wheel was opened by the hotkey and stays up on its own.
        // The hook then treats a left click as "pick" and any other button as "cancel".
        bool hotMode = false, hotKeyOk = false;
        volatile bool wantSummon = false, wantCancel = false;
        // a button-down we swallowed must not leave its button-up behind for AE
        volatile bool eatLUp = false, eatRUp = false, eatMUp = false;
        DateTime downAt = DateTime.MinValue;
        int downX, downY, curX, curY;
        int curSeg = -1, curTool = -1;
        DateTime cfgStamp = DateTime.MinValue;

        public Overlay(string d)
        {
            dir = d;
            cfg = LoadCfg();
            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = false;
            StartPosition = FormStartPosition.Manual;
            TopMost = true;
            Bounds = new Rectangle(-4000, -4000, 10, 10);

            proc = HookCallback;
            hook = SetWindowsHookEx(WH_MOUSE_LL, proc, GetModuleHandle(null), 0);
            Log(hook == IntPtr.Zero ? "hook FAILED" : "hook ok, hold=" + cfg.HoldMs + "ms segs=" + cfg.Segs.Count);

            Beat();

            AeRunning();                  // prime the cached pid before the first click
            StartWatchdog();
            tick = new Timer();
            tick.Interval = 40;
            tick.Tick += OnTick;
            tick.Start();
        }

        protected override CreateParams CreateParams
        {
            get
            {
                CreateParams cp = base.CreateParams;
                cp.ExStyle |= WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE | WS_EX_TOPMOST;
                return cp;
            }
        }
        protected override bool ShowWithoutActivation { get { return true; } }

        // The hotkey is tied to this window handle. RegisterHotKey needs no
        // permission and beats the foreground app to the key, so After Effects
        // never sees Ctrl+Alt+W while the helper is alive.
        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            try
            {
                hotKeyOk = RegisterHotKey(Handle, HK_SUMMON, MOD_SUMMON | MOD_NOREPEAT, VK_W);
                Log(hotKeyOk ? "hotkey Ctrl+Alt+W registered"
                             : "hotkey Ctrl+Alt+W REFUSED (another program owns it), err=" + Marshal.GetLastWin32Error());
            }
            catch (Exception ex) { Log("hotkey register fault: " + ex.Message); }
        }

        // WM_HOTKEY arrives on the message pump, not inside the mouse hook, but the
        // rule is the same: record and return, OnTick does the work.
        protected override void WndProc(ref Message m)
        {
            if (m.Msg == WM_HOTKEY)
            {
                int id = m.WParam.ToInt32();
                if (id == HK_SUMMON) { MaskAlt(); wantSummon = true; }
                else if (id == HK_ESC) wantCancel = true;
                else if (id == HK_ESC_ALT || id == HK_ESC_CA) { MaskAlt(); wantCancel = true; }
                return;
            }
            base.WndProc(ref m);
        }

        void Log(string s)
        {
            try { File.AppendAllText(Path.Combine(dir, "log.txt"), DateTime.Now.ToString("HH:mm:ss.fff") + "  " + s + Environment.NewLine); }
            catch { }
        }

        // ---------- the watchdog ----------
        // A second thread that is NOT the message pump and NOT the hook owner.
        // Every shutdown route used to live on the UI thread - stop.txt, the
        // After-Effects-has-quit check, and the only UnhookWindowsHookEx - so
        // the moment that thread wedged, the process became unkillable with a
        // global mouse hook still installed. Stop-Process, taskkill /F and WMI
        // Terminate were all refused; only a reboot cleared it.
        //
        // This thread can always act: it watches the UI heartbeat, and if the
        // pump stops for 10 seconds it drops the hook and takes the process out
        // with TerminateProcess, which nothing can refuse. It also honours
        // stop.txt itself, so shutting the helper down never depends on a
        // healthy pump.
        System.Threading.Thread watchdog;
        void StartWatchdog()
        {
            gHook = hook;
            watchdog = new System.Threading.Thread(delegate()
            {
                int lastSeen = -1, stalls = 0;
                while (true)
                {
                    try
                    {
                        System.Threading.Thread.Sleep(1000);
                        try { if (File.Exists(Path.Combine(dir, "stop.txt"))) { Log("stop requested (watchdog)"); HardExit(0); } }
                        catch { }
                        int now = uiBeat;
                        if (now == lastSeen)
                        {
                            stalls++;
                            if (stalls >= 10)
                            {
                                Log("UI thread has not ticked for 10 s - releasing the hook and exiting");
                                HardExit(2);
                            }
                        }
                        else { lastSeen = now; stalls = 0; }
                    }
                    catch { }
                }
            });
            watchdog.IsBackground = true;
            watchdog.Name = "atools-watchdog";
            watchdog.Start();
        }
        static IntPtr gHook = IntPtr.Zero;
        void HardExit(int code)
        {
            try { if (gHook != IntPtr.Zero) UnhookWindowsHookEx(gHook); } catch { }
            try { File.Delete(Path.Combine(dir, "pid.txt")); } catch { }
            try { File.Delete(Path.Combine(dir, "owner.lock")); } catch { }
            try { TerminateProcess(GetCurrentProcess(), (uint)code); } catch { }
            try { Environment.Exit(code); } catch { }
        }

        // "<pid>|<unix ms>" - the panel treats it as stale after a few seconds,
        // so a helper that died without cleaning up cannot pass for a live one
        DateTime beatAt = DateTime.MinValue;
        void Beat()
        {
            try
            {
                long ms = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds;
                File.WriteAllText(Path.Combine(dir, "pid.txt"),
                    Process.GetCurrentProcess().Id.ToString() + "|" + ms.ToString());
            }
            catch { }
        }

        Cfg LoadCfg()
        {
            string p = Path.Combine(dir, "wheel.cfg");
            try { cfgStamp = File.GetLastWriteTimeUtc(p); } catch { }
            return Cfg.Load(p);
        }

        // a layout with no tools anywhere can never fire anything
        bool Usable
        {
            get
            {
                if (cfg == null || cfg.Segs == null) return false;
                for (int i = 0; i < cfg.Segs.Count; i++)
                    if (cfg.Segs[i].Tools.Count > 0) return true;
                return false;
            }
        }

        // The pid is resolved by the housekeeping tick, never inside the hook.
        static uint aePid = 0;
        static bool AeRunning()
        {
            try
            {
                Process[] ps = Process.GetProcessesByName("AfterFX");
                if (ps.Length > 0) { aePid = (uint)ps[0].Id; return true; }
                aePid = 0;
                return false;
            }
            catch { return true; }        // never quit on a failed check
        }

        // Called from inside the low-level mouse hook, so it has to be cheap.
        // It used to call Process.GetProcessById, which on .NET Framework
        // snapshots the ENTIRE process table (NtQuerySystemInformation, a
        // buffer that doubles until ~300 records fit) and then searches it -
        // several milliseconds and a few hundred KB of allocation, run
        // synchronously before Windows was allowed to deliver the click. That
        // is why the cursor felt like it stuck on every right-press.
        static bool AeInFront()
        {
            try
            {
                uint pid;
                GetWindowThreadProcessId(GetForegroundWindow(), out pid);
                if (aePid != 0) return pid == aePid;
                // first press before the housekeeping tick has run: resolve once
                string n = Process.GetProcessById((int)pid).ProcessName;
                if (n.IndexOf("AfterFX", StringComparison.OrdinalIgnoreCase) >= 0) { aePid = pid; return true; }
                return false;
            }
            catch { return false; }
        }

        // ---------- the hook ----------
        // ---------- the hook ----------
        // THIS CALLBACK RECORDS AND RETURNS. NOTHING ELSE.
        //
        // A WH_MOUSE_LL callback is not ordinary code: win32k calls it back into
        // this process through the kernel callback dispatcher, on the thread that
        // installed the hook. It used to hide the window, synthesise a click and
        // write a file from in here. Doing window or input work inside that
        // callback re-enters the very input path that is delivering it, and the
        // thread stops coming back - which is exactly the failure that was
        // measured: process alive, message pump dead, hook still installed,
        // 23 GDI handles (nothing leaked), no modal dialog, CPU pinned at a
        // constant. Four of those piled up and the machine crawled.
        //
        // So: set a flag, return. OnTick does the work a moment later.
        volatile bool wantHide = false;      // the wheel was up - fire and close it
        volatile bool wantReplay = false;    // it was an ordinary right-click - re-issue it
        volatile int replayX = 0, replayY = 0;

        IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            try
            {
                if (nCode >= 0)
                {
                    MSLLHOOKSTRUCT m = (MSLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(MSLLHOOKSTRUCT));
                    bool mine = (m.dwExtraInfo.ToUInt64() == SIGNATURE);
                    int msg = wParam.ToInt32();

                    if (!mine)
                    {
                        // leftovers of a button-down we already swallowed
                        if (eatLUp && msg == WM_LBUTTONUP) { eatLUp = false; return (IntPtr)1; }
                        if (eatRUp && msg == WM_RBUTTONUP) { eatRUp = false; return (IntPtr)1; }
                        if (eatMUp && msg == WM_MBUTTONUP) { eatMUp = false; return (IntPtr)1; }

                        if (shown && hotMode)
                        {
                            // Opened by the hotkey: nothing is held down, so the
                            // buttons get new meanings. Left = pick, others = cancel.
                            // The window is click-through, so every click has to be
                            // taken here or After Effects would get it.
                            if (msg == WM_LBUTTONDOWN) { eatLUp = true; wantHide = true; return (IntPtr)1; }
                            if (msg == WM_RBUTTONDOWN) { eatRUp = true; wantCancel = true; return (IntPtr)1; }
                            if (msg == WM_MBUTTONDOWN) { eatMUp = true; wantCancel = true; return (IntPtr)1; }
                            if (msg == WM_MOUSEMOVE) { curX = m.x; curY = m.y; }
                        }
                        else if (msg == WM_RBUTTONDOWN)
                        {
                            // Holding the button back is the ONLY way to tell a click
                            // from a hold, but it delays every ordinary right-click by
                            // the hold time - so never pay that price for a wheel that
                            // has nothing on it.
                            if (Usable && (cfg.AnyApp || AeInFront()))
                            {
                                rDown = true; swallowing = true;
                                downAt = DateTime.Now; downX = m.x; downY = m.y; curX = m.x; curY = m.y;
                                return (IntPtr)1;             // hold it back until we know what it is
                            }
                            rDown = false; swallowing = false;
                        }
                        else if (msg == WM_RBUTTONUP)
                        {
                            if (shown)
                            {
                                rDown = false;
                                wantHide = true;              // OnTick fires and hides it
                                return (IntPtr)1;             // the wheel consumed this click
                            }
                            if (swallowing)
                            {
                                rDown = false; swallowing = false;
                                replayX = m.x; replayY = m.y;
                                wantReplay = true;            // OnTick re-issues the click
                                return (IntPtr)1;
                            }
                            rDown = false;
                        }
                        else if (msg == WM_MOUSEMOVE)
                        {
                            curX = m.x; curY = m.y;
                        }
                    }
                }
            }
            catch { }   // never let anything unwind into the kernel callback
            return CallNextHookEx(hook, nCode, wParam, lParam);
        }

        void ReplayClick(int x, int y)
        {
            try
            {
                mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, (UIntPtr)SIGNATURE);
                mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, (UIntPtr)SIGNATURE);
            }
            catch { }
        }

        // ---------- the loop ----------
        // Nothing in here may escape. An unhandled exception on this thread ends
        // the pump, and a dead pump means stop.txt is never read and the hook is
        // never removed.
        public volatile int uiBeat = 0;
        int tickFaults = 0;
        void OnTick(object s, EventArgs e)
        {
            uiBeat++;                       // the watchdog thread watches this
            try { OnTickCore(); }
            catch (Exception ex)
            {
                tickFaults++;
                try { Log("tick fault #" + tickFaults + ": " + ex.GetType().Name + " " + ex.Message); } catch { }
                // put the wheel back to a sane state rather than leaving it up
                try { shown = false; swallowing = false; rDown = false; ShowWindow(Handle, 0); } catch { }
                try { if (tick != null) tick.Interval = 40; } catch { }
            }
        }
        void OnTickCore()
        {
            // Whatever the hook recorded gets done HERE, on a normal thread,
            // never inside the kernel callback.
            if (wantHide)   { wantHide = false; HideWheel(true); }
            if (wantCancel) { wantCancel = false; if (shown) HideWheel(false); }
            if (wantSummon) { wantSummon = false; Summon(); }
            if (wantReplay) { wantReplay = false; ReplayClick(replayX, replayY); }

            // The heartbeat goes FIRST and in its own guard. It used to sit
            // further down the same try block, so anything that threw above it
            // silently stopped the pulse while the process stayed alive - and a
            // helper that looks dead but still owns the mouse hook is the worst
            // state this thing can be in.
            try
            {
                if ((DateTime.UtcNow - beatAt).TotalMilliseconds > 900)
                {
                    beatAt = DateTime.UtcNow;
                    Beat();
                    if (!cfg.AnyApp && !AeRunning())
                    {
                        Log("After Effects is gone - exiting");
                        Close();
                        Application.Exit();
                        return;
                    }
                }
            }
            catch { }

            try
            {
                if (File.Exists(Path.Combine(dir, "stop.txt")))
                {
                    Log("stop requested");
                    Close();
                    Application.Exit();
                    return;
                }
                string cp = Path.Combine(dir, "wheel.cfg");
                if (File.Exists(cp) && File.GetLastWriteTimeUtc(cp) != cfgStamp)
                {
                    cfg = LoadCfg();
                    Log("config reloaded, segs=" + cfg.Segs.Count);
                }
            }
            catch { }

            // Ctrl+Alt+W belongs to the helper only while After Effects is in front (or
            // AnyApp is on, or the wheel is up so a second Ctrl+Alt+W can close it).
            // RegisterHotKey is system-wide: held permanently it took Ctrl+Alt+W away
            // from every other program for as long as AE was running.
            try
            {
                bool wantKey = cfg.AnyApp || shown || AeInFront();
                if (wantKey && !hotKeyOk)
                    hotKeyOk = RegisterHotKey(Handle, HK_SUMMON, MOD_SUMMON | MOD_NOREPEAT, VK_W);
                else if (!wantKey && hotKeyOk)
                {
                    UnregisterHotKey(Handle, HK_SUMMON);
                    hotKeyOk = false;
                }
            }
            catch { }

            if (!shown)
            {
                if (rDown && Usable &&
                    (DateTime.Now - downAt).TotalMilliseconds >= cfg.HoldMs &&
                    Math.Abs(curX - downX) < 14 && Math.Abs(curY - downY) < 14)
                {
                    ShowWheel();
                    tick.Interval = 15;      // track the cursor at ~66 Hz while it is up
                }
                return;
            }

            // curX/curY already come from the hook in PHYSICAL pixels; asking
            // the OS again only risks mixing coordinate spaces.
            int wasS = curSeg, wasT = curTool;
            Track(curX, curY);
            if (wasS != curSeg || wasT != curTool) Render();
        }

        // 05.09.2026: холст 2,0 R (было 1,60) — вдвое большая якорная сетка (до 1,97 R) иначе не влезала.
        int Half { get { return (int)(cfg.R * 2.00) + 8; } }

        void ShowWheel()
        {
            shown = true;
            curSeg = -1; curTool = -1;
            Render();
            ShowWindow(Handle, 8 /* SW_SHOWNOACTIVATE */);
            Log("wheel shown at " + downX + "," + downY);
            // Tell the panel the gesture has STARTED, through the channel it is
            // already polling. It uses the second or so before the button comes
            // up to build the floating card window, so the card is there the
            // instant a tool is chosen instead of a beat later. Without this the
            // panel only heard about the gesture when it was already over, and
            // the first attempt of a session always looked like it did nothing.
            try { File.WriteAllText(Path.Combine(dir, "cmd.txt"), "~open"); } catch { }
        }

        // Ctrl+Alt+W: open the wheel under the cursor and leave it up. Pressing it
        // again while it is up closes it. Same gate as the gesture: a wheel with
        // nothing on it, or After Effects not in front, is ignored.
        // Alt alone must not reach After Effects as a lone press-and-release: the W
        // is swallowed by the hotkey, so AE would see Alt down + Alt up with nothing
        // between and put its menu bar into keyboard mode (the next letter then goes
        // to the menu). An unassigned virtual key tapped while Alt is still held
        // makes that Alt a combination - the same "menu mask key" AutoHotkey uses.
        const byte VK_MENU_MASK = 0xE8;
        const uint KEYEVENTF_KEYUP = 0x0002;
        void MaskAlt()
        {
            try
            {
                if ((GetAsyncKeyState(0x12 /* VK_MENU */) & 0x8000) != 0)
                {
                    keybd_event(VK_MENU_MASK, 0, 0, UIntPtr.Zero);
                    keybd_event(VK_MENU_MASK, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
                }
            }
            catch { }
        }

        void Summon()
        {
            if (shown) { HideWheel(false); return; }
            if (!Usable) { Log("hotkey: the wheel has no tools - ignored"); return; }
            if (!cfg.AnyApp && !AeInFront()) { Log("hotkey: After Effects is not in front - ignored"); return; }
            POINT p;
            if (!GetCursorPos(out p)) return;
            downX = p.x; downY = p.y; curX = p.x; curY = p.y;
            rDown = false; swallowing = false;
            hotMode = true;
            ShowWheel();
            tick.Interval = 15;
            // Esc closes it - registered only while the wheel is up, so the key
            // belongs to After Effects the rest of the time
            try { RegisterHotKey(Handle, HK_ESC, MOD_NOREPEAT, VK_ESCAPE); } catch { }
            // Alt is often still held right after Ctrl+Alt+W: Alt+Esc would otherwise be the
            // system shortcut that sends After Effects to the back with the wheel left up
            try { RegisterHotKey(Handle, HK_ESC_ALT, MOD_ALT | MOD_NOREPEAT, VK_ESCAPE); } catch { }
            // Ctrl+Alt are usually both still down right after Ctrl+Alt+W
            try { RegisterHotKey(Handle, HK_ESC_CA, MOD_CONTROL | MOD_ALT | MOD_NOREPEAT, VK_ESCAPE); } catch { }
            Log("wheel opened by hotkey at " + downX + "," + downY);
        }

        void HideWheel(bool fire)
        {
            if (hotMode)
            {
                hotMode = false;
                try { UnregisterHotKey(Handle, HK_ESC); } catch { }
                try { UnregisterHotKey(Handle, HK_ESC_ALT); } catch { }
                try { UnregisterHotKey(Handle, HK_ESC_CA); } catch { }
                if (!fire) Log("wheel closed without a pick");
            }
            shown = false; swallowing = false;
            try { if (tick != null) tick.Interval = 40; } catch { }
            ShowWindow(Handle, 0 /* SW_HIDE */);
            if (fire && curSeg >= 0 && curSeg < cfg.Segs.Count)
            {
                Seg sg = cfg.Segs[curSeg];
                if (curTool >= 0 && curTool < sg.Tools.Count)
                {
                    string cmd = sg.Tools[curTool].Cmd;
                    try { File.WriteAllText(Path.Combine(dir, "cmd.txt"), cmd); } catch { }
                    Log("fired " + cmd);
                }
            }
            curSeg = -1; curTool = -1;
        }

        // ---------- geometry, mirroring the panel ----------
        double SegStart { get { return -90.0 - (360.0 / cfg.Segs.Count) / 2.0; } }
        double ArcStart(int si)
        {
            int n = cfg.Segs[si].Tools.Count;
            double step = 360.0 / cfg.Segs.Count;
            double mid = SegStart + step * (si + 0.5);
            return mid - (n * 36.0) / 2.0;
        }

        void Track(int gx, int gy)
        {
            double cx = downX, cy = downY;
            double dx = gx - cx, dy = gy - cy;
            double r = Math.Sqrt(dx * dx + dy * dy);
            double a = Math.Atan2(dy, dx) * 180.0 / Math.PI;
            int n = cfg.Segs.Count;
            double step = 360.0 / n;
            double hubR = cfg.R * 0.313;

            // Same three zones as the panel: the hub chooses nothing and is how
            // you cancel; inside the disc the section follows the cursor but NO
            // tool is armed yet; past the disc the section is locked and only
            // its tools can be picked. Letting go anywhere but on a tile does
            // nothing. (This used to arm a tool while still inside the disc, so
            // releasing over the middle of the wheel fired something.)
            if (r <= hubR) { curSeg = -1; curTool = -1; return; }
            if (r <= cfg.R) { curSeg = SegAt(a, step); curTool = -1; return; }
            if (curSeg < 0) curSeg = SegAt(a, step);

            List<Tool> tools = cfg.Segs[curSeg].Tools;
            if (tools.Count == 0) { curTool = -1; return; }

            // an anchor section is a grid of places: pick the cell under the cursor
            int[] ag = SegAnchor(curSeg);
            if (ag != null)
            {
                double mid = SegStart + step * (curSeg + 0.5);
                // grid centre, measured from the wheel's own centre
                double gcx = Math.Cos(mid * Math.PI / 180.0) * cfg.R * AG_R;
                double gcy = Math.Sin(mid * Math.PI / 180.0) * cfg.R * AG_R;
                double span = cfg.R * AG_SPAN, half = span / 2.0;
                double ox = dx - gcx, oy = dy - gcy;      // cursor, relative to the grid
                curTool = -1;
                if (Math.Abs(ox) <= half && Math.Abs(oy) <= half)
                {
                    double cw = span / 3.0;
                    int cc = (int)Math.Floor((ox + half) / cw);
                    int cr = (int)Math.Floor((oy + half) / cw);
                    if (cc < 0) cc = 0; if (cc > 2) cc = 2;
                    if (cr < 0) cr = 0; if (cr > 2) cr = 2;
                    curTool = ag[cr * 3 + cc];
                }
                return;
            }

            double a0 = ArcStart(curSeg);
            double relT = ((a - a0) % 360 + 360) % 360;
            int ti = (int)Math.Floor(relT / 36.0);
            if (ti < 0 || ti >= tools.Count)
            {
                double mid = SegStart + step * (curSeg + 0.5);
                double d = ((a - mid) % 360 + 360) % 360;
                if (d > 180) d -= 360;
                ti = (d < 0) ? 0 : tools.Count - 1;
            }
            curTool = ti;
        }

        int SegAt(double a, double step)
        {
            double rel = ((a - SegStart) % 360 + 360) % 360;
            int i = (int)Math.Floor(rel / step);
            if (i < 0) i = 0;
            if (i >= cfg.Segs.Count) i = cfg.Segs.Count - 1;
            return i;
        }

        // ---------- painting ----------
        // The surface is allocated ONCE and redrawn in place. It used to be a
        // fresh 624x624x4 = 1.5 MB bitmap per frame, which is over the 85 KB
        // large-object threshold - so every wheel frame dropped a 1.5 MB block
        // on the LOH and invited a blocking gen-2 collection ON THE SAME THREAD
        // the low-level mouse hook is dispatched on. Windows silently and
        // permanently unhooks a callback that takes longer than its timeout, so
        // the wheel would simply stop responding to the right button one day and
        // never come back.
        Bitmap surface = null;
        public Bitmap RenderBitmap()
        {
            int half = Half, size = half * 2;
            if (surface == null || surface.Width != size)
            {
                if (surface != null) surface.Dispose();
                surface = new Bitmap(size, size, PixelFormat.Format32bppArgb);
            }
            Bitmap bmp = surface;
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
                g.Clear(Color.Transparent);

                float R = cfg.R;
                float cx = half, cy = half;
                int n = cfg.Segs.Count;
                float step = 360f / n;
                float hubR = R * 0.313f;
                float lblR = R * 0.680f;
                float tileIn = R * 1.160f, tileOut = R * 1.550f, tlblR = R * 1.355f;
                float lblF = R * 0.095f, tlblF = R * 0.082f, hubF = R * 0.105f;

                // the tool arc of the active segment, drawn first
                if (curSeg >= 0 && curSeg < n)
                {
                    Seg sg = cfg.Segs[curSeg];
                    double a0 = ArcStart(curSeg);
                    int[] ag = SegAnchor(curSeg);
                    if (ag != null)
                    {
                        // one grid for the whole section, out clear of the disc
                        float gx, gy;
                        AnchorCentre(curSeg, cx, cy, out gx, out gy);
                        DrawAnchorGrid(g, gx, gy, cfg.R * AG_SPAN, ag, curTool, sg.Col);
                    }
                    else
                    for (int i = 0; i < sg.Tools.Count; i++)
                    {
                        float ta = (float)(a0 + i * 36.0);
                        bool hot = (i == curTool);
                        using (Brush b = new SolidBrush(hot ? sg.Col : Color.FromArgb(242, 42, 46, 55)))
                            g.FillPath(b, Ring(cx, cy, tileIn, tileOut, ta + 1.6f, ta + 36f - 1.6f));
                        float tm = (float)(a0 + 36.0 * (i + 0.5));
                        float lx = cx + (float)(Math.Cos(tm * Math.PI / 180) * tlblR);
                        float ly = cy + (float)(Math.Sin(tm * Math.PI / 180) * tlblR);
                        DrawText(g, sg.Tools[i].N, lx, ly, tlblF,
                                 hot ? Color.White : Color.FromArgb(195, 201, 211), hot);
                    }
                }

                // the disc
                using (Brush b = new SolidBrush(Color.FromArgb(242, 31, 34, 41)))
                    g.FillEllipse(b, cx - R, cy - R, R * 2, R * 2);

                // the highlighted wedge
                if (curSeg >= 0 && curSeg < n)
                {
                    float a0 = (float)(SegStart + step * curSeg);
                    using (Brush b = new SolidBrush(cfg.Segs[curSeg].Col))
                        g.FillPath(b, Ring(cx, cy, hubR, R, a0, a0 + step));
                }

                // dividers
                using (Pen pen = new Pen(Color.FromArgb(28, 255, 255, 255), Math.Max(1f, R * 0.006f)))
                    for (int i = 0; i < n; i++)
                    {
                        double a = (SegStart + step * i) * Math.PI / 180;
                        g.DrawLine(pen, cx + (float)(Math.Cos(a) * hubR), cy + (float)(Math.Sin(a) * hubR),
                                        cx + (float)(Math.Cos(a) * R), cy + (float)(Math.Sin(a) * R));
                    }

                // section labels
                for (int i = 0; i < n; i++)
                {
                    double mid = (SegStart + step * (i + 0.5)) * Math.PI / 180;
                    bool hot = (i == curSeg);
                    DrawText(g, cfg.Segs[i].Name, cx + (float)(Math.Cos(mid) * lblR), cy + (float)(Math.Sin(mid) * lblR),
                             lblF, hot ? Color.White : Color.FromArgb(195, 201, 211), hot);
                }

                // hub
                using (Brush b = new SolidBrush(Color.FromArgb(248, 19, 22, 28)))
                    g.FillEllipse(b, cx - hubR, cy - hubR, hubR * 2, hubR * 2);
                Color ring = (curSeg >= 0) ? cfg.Segs[curSeg].Col : Color.FromArgb(59, 143, 220);
                using (Pen pen = new Pen(ring, Math.Max(1.4f, R * 0.014f)))
                    g.DrawEllipse(pen, cx - hubR, cy - hubR, hubR * 2, hubR * 2);

                string word = "ATOOLS";
                if (curSeg >= 0)
                {
                    Seg sg = cfg.Segs[curSeg];
                    word = (curTool >= 0 && curTool < sg.Tools.Count) ? sg.Tools[curTool].N : sg.Name;
                }
                DrawText(g, word, cx, cy, hubF, (curSeg >= 0) ? ring : Color.FromArgb(195, 201, 211), true);
            }
            return bmp;
        }

        // ONE path, reset and refilled. It used to hand back a new GraphicsPath
        // on every call and neither caller disposed it - eight per frame at up to
        // 66 frames a second is about 530 finalisable objects per second, each
        // holding a native GDI+ path, all waiting on the finaliser thread.
        readonly GraphicsPath ringPath = new GraphicsPath();
        GraphicsPath Ring(float cx, float cy, float ri, float ro, float a0, float a1)
        {
            ringPath.Reset();
            ringPath.AddArc(cx - ro, cy - ro, ro * 2, ro * 2, a0, a1 - a0);
            ringPath.AddArc(cx - ri, cy - ri, ri * 2, ri * 2, a1, -(a1 - a0));
            ringPath.CloseFigure();
            return ringPath;
        }

        // An Anchor section is ONE nine-cell grid, not nine separate tiles.
        // Same geometry as the panel (05.09.2026, слово владельца: сетка вдвое
        // больше): 0.88 R по стороне, центр на 1.53 R — 1.09 R … 1.97 R, диск не задет.
        const float AG_R = 1.53f, AG_SPAN = 0.88f, AG_GAPF = 0.10f;
        // idx[row*3+col] = index of the tool that owns that cell, -1 if none.
        int[] SegAnchor(int si)
        {
            if (si < 0 || si >= cfg.Segs.Count) return null;
            List<Tool> t = cfg.Segs[si].Tools;
            if (t.Count < 2) return null;
            int[] idx = new int[9];
            for (int k = 0; k < 9; k++) idx[k] = -1;
            for (int i = 0; i < t.Count; i++)
            {
                int c, r;
                if (!AnchorCell(t[i].Cmd, out c, out r)) return null;   // all or nothing
                idx[r * 3 + c] = i;
            }
            return idx;
        }
        void AnchorCentre(int si, float cx, float cy, out float gx, out float gy)
        {
            double step = 360.0 / cfg.Segs.Count;
            double mid = SegStart + step * (si + 0.5);
            gx = cx + (float)(Math.Cos(mid * Math.PI / 180) * cfg.R * AG_R);
            gy = cy + (float)(Math.Sin(mid * Math.PI / 180) * cfg.R * AG_R);
        }

        // "anchor:0.5,1" -> column 1, row 2 of the nine-cell grid.
        static bool AnchorCell(string cmd, out int col, out int row)
        {
            col = 0; row = 0;
            if (string.IsNullOrEmpty(cmd) || !cmd.StartsWith("anchor:")) return false;
            string[] p = cmd.Substring(7).Split(',');
            if (p.Length != 2) return false;
            double gx, gy;
            if (!double.TryParse(p[0], System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out gx)) return false;
            if (!double.TryParse(p[1], System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out gy)) return false;
            col = (int)Math.Round(gx * 2); row = (int)Math.Round(gy * 2);
            return col >= 0 && col <= 2 && row >= 0 && row <= 2;
        }

        // An anchor point is a POSITION. A picture of where it sits reads
        // instantly; "BR" has to be decoded.
        // ONE grid for the whole section. idx[row*3+col] says which tool owns a
        // cell, and the cell whose tool is armed is the one lit.
        void DrawAnchorGrid(Graphics g, float cx, float cy, float span, int[] idx, int armed, Color tint)
        {
            float gap = span * AG_GAPF;
            float cell = (span - gap * 2f) / 3f;
            float x0 = cx - span / 2f, y0 = cy - span / 2f;
            for (int r = 0; r < 3; r++)
            {
                for (int c = 0; c < 3; c++)
                {
                    int t = idx[r * 3 + c];
                    bool on = (t >= 0 && t == armed);
                    float x = x0 + c * (cell + gap), y = y0 + r * (cell + gap);
                    using (GraphicsPath rp = RoundRect(x, y, cell, cell, cell * 0.26f))
                    {
                        using (Brush bf = new SolidBrush(Color.FromArgb(on ? 36 : 13, 255, 255, 255)))
                            g.FillPath(bf, rp);
                        using (Pen pn = new Pen(on ? tint : Color.FromArgb(28, 255, 255, 255), on ? 3f : 1.4f))
                            g.DrawPath(pn, rp);
                    }
                    float dr = cell * 0.15f;
                    using (Brush db = new SolidBrush(on ? Color.White : Color.FromArgb(107, 255, 255, 255)))
                        g.FillEllipse(db, x + cell / 2f - dr, y + cell / 2f - dr, dr * 2, dr * 2);
                }
            }
        }
        static GraphicsPath RoundRect(float x, float y, float w, float h, float r)
        {
            GraphicsPath p = new GraphicsPath();
            if (r <= 0.1f) { p.AddRectangle(new RectangleF(x, y, w, h)); return p; }
            float d = r * 2;
            p.AddArc(x, y, d, d, 180, 90);
            p.AddArc(x + w - d, y, d, d, 270, 90);
            p.AddArc(x + w - d, y + h - d, d, d, 0, 90);
            p.AddArc(x, y + h - d, d, d, 90, 90);
            p.CloseFigure();
            return p;
        }

        void DrawText(Graphics g, string s, float x, float y, float size, Color col, bool bold)
        {
            if (string.IsNullOrEmpty(s)) return;
            using (Font f = new Font("Segoe UI", size * 0.75f, bold ? FontStyle.Bold : FontStyle.Regular, GraphicsUnit.Pixel))
            using (Brush b = new SolidBrush(col))
            using (StringFormat sf = new StringFormat())
            {
                sf.Alignment = StringAlignment.Center;
                sf.LineAlignment = StringAlignment.Center;
                sf.FormatFlags = StringFormatFlags.NoWrap;
                g.DrawString(s, f, b, x, y, sf);
            }
        }

        // The happy path here never leaked - measured, net zero over 2000 frames.
        // The EXCEPTION path did: two kernel handles per aborted frame, and the
        // garbage collector cannot reclaim them because raw IntPtrs have no
        // finaliser. GetHbitmap is the realistic thrower and it fails precisely
        // when GDI is already under pressure, so one bad frame used to become a
        // spiral. finally closes it.
        void Render()
        {
            int half = Half, size = half * 2;
            IntPtr screen = IntPtr.Zero, mem = IntPtr.Zero, hBmp = IntPtr.Zero, old = IntPtr.Zero;
            try
            {
                Bitmap bmp = RenderBitmap();     // shared surface - do NOT dispose
                if (bmp == null) return;
                screen = GetDC(IntPtr.Zero);
                if (screen == IntPtr.Zero) return;
                mem = CreateCompatibleDC(screen);
                if (mem == IntPtr.Zero) return;
                hBmp = bmp.GetHbitmap(Color.FromArgb(0));
                old = SelectObject(mem, hBmp);

                SIZE sz; sz.cx = size; sz.cy = size;
                POINT src; src.x = 0; src.y = 0;
                POINT dst; dst.x = downX - half; dst.y = downY - half;
                BLENDFUNCTION bf = new BLENDFUNCTION();
                bf.BlendOp = 0; bf.BlendFlags = 0; bf.SourceConstantAlpha = 255; bf.AlphaFormat = 1;

                UpdateLayeredWindow(Handle, screen, ref dst, ref sz, mem, ref src, 0, ref bf, ULW_ALPHA);
            }
            finally
            {
                if (mem != IntPtr.Zero && old != IntPtr.Zero) SelectObject(mem, old);
                if (hBmp != IntPtr.Zero) DeleteObject(hBmp);
                if (mem != IntPtr.Zero) DeleteDC(mem);
                if (screen != IntPtr.Zero) ReleaseDC(IntPtr.Zero, screen);
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            try { UnregisterHotKey(Handle, HK_SUMMON); UnregisterHotKey(Handle, HK_ESC); UnregisterHotKey(Handle, HK_ESC_ALT); UnregisterHotKey(Handle, HK_ESC_CA); } catch { }
            try { if (hook != IntPtr.Zero) UnhookWindowsHookEx(hook); } catch { }
            try { File.Delete(Path.Combine(dir, "pid.txt")); } catch { }
            Log("stopped");
            base.OnFormClosing(e);
        }

        // ---------- entry points ----------
        public static void Run(string dir)
        {
            Application.EnableVisualStyles();
            Overlay o = new Overlay(dir);
            Application.Run(o);
        }

        public static void SelfTest(string dir)
        {
            Overlay o = new Overlay(dir);
            o.shown = true;
            o.downX = o.Half; o.downY = o.Half;
            /* with no wheel.cfg yet there are no sections, and pretending one is
               selected walked straight off the end of the list */
            o.curSeg = (o.cfg.Segs.Count > 0) ? 0 : -1;
            o.curTool = (o.cfg.Segs.Count > 0 && o.cfg.Segs[0].Tools.Count > 0) ? o.cfg.Segs[0].Tools.Count / 2 : -1;
            {
                Bitmap b = o.RenderBitmap();     // shared surface - do NOT dispose
                Bitmap flat = new Bitmap(b.Width, b.Height, PixelFormat.Format32bppArgb);
                using (Graphics g = Graphics.FromImage(flat))
                {
                    g.Clear(Color.FromArgb(255, 24, 26, 30));
                    g.DrawImage(b, 0, 0);
                }
                flat.Save(Path.Combine(dir, "selftest.png"), ImageFormat.Png);
                flat.Dispose();
            }
            try { if (o.hook != IntPtr.Zero) UnhookWindowsHookEx(o.hook); } catch { }
            try { File.Delete(Path.Combine(dir, "pid.txt")); } catch { }
        }
    }
}
'@

Add-Type -TypeDefinition $cs -ReferencedAssemblies System.Windows.Forms, System.Drawing -ErrorAction Stop

# The -Dir contract has to fail LOUDLY. This used to fall through on a bad or
# unwritable folder straight into Run(), which installs a global mouse hook that
# swallows every held right-click in After Effects while the wheel it is meant
# to open can never appear - a hook with no way to switch it off.
if ($Dir -match "[`r`n`t]") { throw "atools_wheel: -Dir contains a control character: $([regex]::Escape($Dir))" }
$Dir = [System.IO.Path]::GetFullPath($Dir)
New-Item -ItemType Directory -Force -Path $Dir -ErrorAction Stop | Out-Null
[System.IO.File]::AppendAllText((Join-Path $Dir "log.txt"), "")   # proves it is writable, throws if not
function Write-WheelLog($msg) {
  Add-Content -Path (Join-Path $Dir "log.txt") -Encoding UTF8 -Value (
    "{0}  {1}" -f (Get-Date -Format "HH:mm:ss.fff"), $msg)
}

# ONE helper at a time, and never a zombie one.
#
# This used to be a bare mutex, and it deadlocked: the incumbent is told to quit
# by writing stop.txt, but the newcomer deleted stop.txt on startup BEFORE it
# reached the mutex - so the incumbent never saw the request, the newcomer died
# on the lock, and a helper whose heartbeat had stopped kept the global mouse
# hook for good. Right-clicks disappeared everywhere with no way back.
#
# So the pid file, not the mutex, decides. A healthy incumbent (alive AND
# beating) wins and we leave. An incumbent that is alive but silent is wedged,
# and gets taken out before we take over.
$ownerLock = $null
if (-not $SelfTest) {
  # Belt: a helper from an older build knows nothing about the lock below, and
  # one of those wedged with its hook installed is exactly what must never be
  # joined by a second one.
  $others = @()
  try {
    $others = @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction Stop |
      Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -like '*atools_wheel.ps1*' })
  } catch {}
  if ($others.Count -gt 0) {
    $ids = ($others | ForEach-Object { $_.ProcessId }) -join ", "
    Write-WheelLog "helper process already running (pid $ids) - not starting a second one; run tools\stop_wheel_helper.bat to clear a wedged one"
    exit 0
  }

  # Braces: ONE helper, enforced by a lock the OPERATING SYSTEM holds.
  #
  # Every previous attempt at this used a file we wrote ourselves (pid.txt) or a
  # named mutex, and both failed in the same way: the record outlived, or was
  # lost by, the process it described. A helper would start beside the wedged
  # ones, and each one installs a global mouse hook. Four of them is what made
  # the machine crawl.
  #
  # An exclusively-opened file cannot lie. Windows releases the handle when the
  # process ends BY ANY MEANS - clean exit, crash, kill - so "can I open it?" is
  # exactly the question "is a helper running?", with no stale state possible.
  $lockPath = Join-Path $Dir "owner.lock"
  try {
    $ownerLock = [System.IO.File]::Open($lockPath, 'OpenOrCreate', 'ReadWrite', 'None')
    $bytes = [System.Text.Encoding]::ASCII.GetBytes("$PID")
    $ownerLock.SetLength(0); $ownerLock.Write($bytes, 0, $bytes.Length); $ownerLock.Flush()
  } catch {
    $held = ""
    try { $held = [System.IO.File]::ReadAllText($lockPath) } catch {}
    Write-WheelLog "another helper already owns the wheel (pid $held) - not starting a second one"
    exit 0
  }
}

# only now, once we know we are the one that should run
Remove-Item (Join-Path $Dir "stop.txt") -ErrorAction SilentlyContinue

# There is deliberately no mutex here any more. It was the thing that broke:
# a named mutex whose owner is killed becomes ABANDONED, and the next waiter
# does not simply get it - so the takeover above would kill the zombie and then
# refuse to start itself, leaving nobody running the wheel and the right mouse
# button in limbo. The pid file is a single, checkable source of truth and it
# already answers the only question that matters: is a healthy helper running?
# the first thing in the log, so a wrong-place wheel is diagnosable at a glance
Add-Content -Path (Join-Path $Dir "log.txt") -Encoding UTF8 -Value (
  "{0}  start, dpi={1}, screen={2}x{3}" -f (Get-Date -Format "HH:mm:ss.fff"), $dpiMode,
  [System.Windows.Forms.SystemInformation]::VirtualScreen.Width,
  [System.Windows.Forms.SystemInformation]::VirtualScreen.Height)

if ($SelfTest) { [AtoolsWheel.Overlay]::SelfTest($Dir) }
else { [AtoolsWheel.Overlay]::Run($Dir) }
