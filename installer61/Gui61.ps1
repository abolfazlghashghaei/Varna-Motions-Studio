param([ValidateSet('Install','Remove')][string]$InitialAction='Install',[Parameter(Mandatory=$true)][string]$ResultPath)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()
$stateRoot=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Setup61State'
$logsRoot=Join-Path $env:LOCALAPPDATA 'VarnaMotionStudio\Logs61'
New-Item -ItemType Directory $stateRoot,$logsRoot -Force|Out-Null
$script:lang='fa';$script:job=$null;$script:inventory=$null;$script:scanReady=$false;$script:success=$false;$script:lastAction='';$script:changed=$false;$script:lastText='';$script:session=$null;$script:firstInspect=$true
function T([string]$en,[string]$fa){if($script:lang -eq 'fa'){return $fa};return $en}
$bg=[Drawing.ColorTranslator]::FromHtml('#0C121B');$card=[Drawing.ColorTranslator]::FromHtml('#172330');$fg=[Drawing.ColorTranslator]::FromHtml('#EEF6FA');$muted=[Drawing.ColorTranslator]::FromHtml('#A3B8C8');$accent=[Drawing.ColorTranslator]::FromHtml('#7CE1D0')
$form=New-Object Windows.Forms.Form
$form.Text='Varna | نصب و مدیریت';$form.Size=New-Object Drawing.Size(1100,740);$form.MinimumSize=New-Object Drawing.Size(960,650);$form.StartPosition='CenterScreen';$form.BackColor=$bg;$form.ForeColor=$fg;$form.Font=New-Object Drawing.Font('Segoe UI',10);$form.AutoScaleMode='Dpi'
$form.Icon=New-Object Drawing.Icon((Join-Path $PSScriptRoot 'assets\varna.ico'))
$sidebar=New-Object Windows.Forms.Panel;$sidebar.Dock='Left';$sidebar.Width=190;$sidebar.BackColor=[Drawing.ColorTranslator]::FromHtml('#101E2C');$form.Controls.Add($sidebar)
$picture=New-Object Windows.Forms.PictureBox;$picture.Dock='Fill';$picture.SizeMode='Zoom';$picture.Image=[Drawing.Image]::FromFile((Join-Path $PSScriptRoot 'assets\sidebar.png'));$sidebar.Controls.Add($picture)
$brand=New-Object Windows.Forms.Label;$brand.Text="VARNA`r`nSTUDIO";$brand.Font=New-Object Drawing.Font('Segoe UI',19,[Drawing.FontStyle]::Bold);$brand.Height=110;$brand.Dock='Top';$brand.TextAlign='MiddleCenter';$sidebar.Controls.Add($brand)
$ver=New-Object Windows.Forms.Label;$ver.Text="SETUP 62 · PREVIEW`r`nINSTALL  /  REPAIR  /  REMOVE";$ver.Height=70;$ver.Dock='Bottom';$ver.TextAlign='MiddleCenter';$ver.ForeColor=$muted;$ver.Font=New-Object Drawing.Font('Segoe UI',8);$sidebar.Controls.Add($ver)
$main=New-Object Windows.Forms.TableLayoutPanel;$main.Dock='Fill';$main.Padding=New-Object Windows.Forms.Padding(20,12,20,12);$main.ColumnCount=1;$main.RowCount=7
foreach($height in @(58,170,47,86,34)){[void]$main.RowStyles.Add((New-Object Windows.Forms.RowStyle([Windows.Forms.SizeType]::Absolute,$height)))}
[void]$main.RowStyles.Add((New-Object Windows.Forms.RowStyle([Windows.Forms.SizeType]::Percent,100)));[void]$main.RowStyles.Add((New-Object Windows.Forms.RowStyle([Windows.Forms.SizeType]::Absolute,46)))
$form.Controls.Add($main);$main.BringToFront()
function Label61([string]$text){$v=New-Object Windows.Forms.Label;$v.Text=$text;$v.AutoSize=$false;$v.ForeColor=$fg;$v.Dock='Fill';$v.TextAlign='MiddleLeft';return $v}
function Button61([string]$text){$b=New-Object Windows.Forms.Button;$b.Text=$text;$b.FlatStyle='Flat';$b.FlatAppearance.BorderColor=$accent;$b.BackColor=$card;$b.ForeColor=$fg;$b.FlatAppearance.MouseOverBackColor=[Drawing.ColorTranslator]::FromHtml('#244456');$b.FlatAppearance.MouseDownBackColor=[Drawing.ColorTranslator]::FromHtml('#315C66');$b.Height=34;$b.Width=140;$b.Margin=New-Object Windows.Forms.Padding(0,3,10,3);return $b}
$header=New-Object Windows.Forms.TableLayoutPanel;$header.Dock='Fill';$header.ColumnCount=2;[void]$header.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle([Windows.Forms.SizeType]::Percent,100)));[void]$header.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle([Windows.Forms.SizeType]::Absolute,115)))
$title=Label61 '';$title.Font=New-Object Drawing.Font('Segoe UI',17,[Drawing.FontStyle]::Bold);$header.Controls.Add($title,0,0)
$language=New-Object Windows.Forms.ComboBox;$language.DropDownStyle='DropDownList';$language.BackColor=$card;$language.ForeColor=$fg;$language.FlatStyle='Flat';$language.Items.AddRange(@('فارسی','English'));$language.SelectedIndex=0;$language.Dock='Fill';$header.Controls.Add($language,1,0);$main.Controls.Add($header,0,0)
$options=New-Object Windows.Forms.TableLayoutPanel;$options.Dock='Fill';$options.BackColor=$card;$options.Padding=New-Object Windows.Forms.Padding(12);$options.ColumnCount=2;$options.RowCount=4
[void]$options.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle([Windows.Forms.SizeType]::Percent,48)));[void]$options.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle([Windows.Forms.SizeType]::Percent,52)))
for($i=0;$i -lt 4;$i++){[void]$options.RowStyles.Add((New-Object Windows.Forms.RowStyle([Windows.Forms.SizeType]::Percent,25)))}
$action=New-Object Windows.Forms.ComboBox;$action.DropDownStyle='DropDownList';$action.BackColor=$card;$action.ForeColor=$fg;$action.FlatStyle='Flat';$action.Dock='Fill';$options.Controls.Add($action,0,0)
$mode=Label61 '';$mode.ForeColor=$muted;$options.Controls.Add($mode,1,0)
$hostPanel=New-Object Windows.Forms.FlowLayoutPanel;$hostPanel.Dock='Fill';$hostPanel.WrapContents=$false
$hostChecks=@{}
foreach($h in @('AE','Premiere','Resolve')){$check=New-Object Windows.Forms.CheckBox;$check.Text=@{AE='After Effects';Premiere='Premiere';Resolve='DaVinci Resolve'}[$h];$check.Width=125;$check.Height=28;$check.Checked=$h -eq 'AE';$hostPanel.Controls.Add($check);$hostChecks[$h]=$check}
$options.Controls.Add($hostPanel,0,1);$options.SetColumnSpan($hostPanel,2)
$engine=New-Object Windows.Forms.CheckBox;$engine.Dock='Fill';$options.Controls.Add($engine,0,2)
$clearCache=New-Object Windows.Forms.CheckBox;$clearCache.Dock='Fill';$clearCache.Visible=$false;$options.Controls.Add($clearCache,1,2)
$info=Label61 '';$info.ForeColor=$muted;$info.Font=New-Object Drawing.Font('Segoe UI',9);$options.Controls.Add($info,0,3);$options.SetColumnSpan($info,2)
$main.Controls.Add($options,0,1)
$buttons=New-Object Windows.Forms.FlowLayoutPanel;$buttons.Dock='Fill';$buttons.WrapContents=$false
$inspect=Button61 '';$start=Button61 '';$cancel=Button61 '';$openLogs=Button61 '';$guide=Button61 '';$guide.Width=95;$cancel.Enabled=$false
$start.BackColor=$accent;$start.ForeColor=$bg
foreach($b in @($inspect,$start,$cancel,$openLogs,$guide)){$buttons.Controls.Add($b)};$main.Controls.Add($buttons,0,2)
$transfer=New-Object Windows.Forms.TableLayoutPanel;$transfer.Dock='Fill';$transfer.RowCount=3
$downloadInfo=Label61 '';$downloadInfo.ForeColor=$accent;$downloadInfo.Font=New-Object Drawing.Font('Segoe UI',10,[Drawing.FontStyle]::Bold)
$downloadBar=New-Object Windows.Forms.ProgressBar;$downloadBar.Dock='Fill';$downloadBar.Height=12
$stageInfo=Label61 '';$stageInfo.ForeColor=$muted;$transfer.Controls.Add($downloadInfo,0,0);$transfer.Controls.Add($downloadBar,0,1);$transfer.Controls.Add($stageInfo,0,2);$main.Controls.Add($transfer,0,3)
$status=Label61 '';$status.ForeColor=$accent;$main.Controls.Add($status,0,4)
$details=New-Object Windows.Forms.RichTextBox;$details.Dock='Fill';$details.ReadOnly=$true;$details.BackColor=[Drawing.ColorTranslator]::FromHtml('#080E16');$details.ForeColor=$fg;$details.BorderStyle='None';$details.Font=New-Object Drawing.Font('Consolas',9);$details.WordWrap=$false;$logPanel=New-Object Windows.Forms.Panel;$logPanel.Dock='Fill'
$summary=Label61 ''; $summary.Font=New-Object Drawing.Font('Segoe UI',12);$summary.TextAlign='TopRight';$summary.Padding=New-Object Windows.Forms.Padding(12);$summary.BackColor=$card
$logPanel.Controls.Add($details);$logPanel.Controls.Add($summary);$summary.BringToFront();$main.Controls.Add($logPanel,0,5)
$footer=New-Object Windows.Forms.TableLayoutPanel;$footer.Dock='Fill';$footer.ColumnCount=2;[void]$footer.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle([Windows.Forms.SizeType]::Percent,100)));[void]$footer.ColumnStyles.Add((New-Object Windows.Forms.ColumnStyle([Windows.Forms.SizeType]::Absolute,115)))
$technical=New-Object Windows.Forms.LinkLabel;$technical.AutoSize=$true;$technical.Dock='Bottom';$technical.LinkColor=$accent;$technical.Text='جزئیات فنی / Technical details';$logPanel.Controls.Add($technical);$technical.BringToFront()
$note=Label61 '';$note.Font=New-Object Drawing.Font('Segoe UI',8);$note.ForeColor=$muted;$close=Button61 '';$close.Dock='Fill';$footer.Controls.Add($note,0,0);$footer.Controls.Add($close,1,0);$main.Controls.Add($footer,0,6)
function Action61 {if($action.SelectedIndex -ge 0){return @('Install','Repair','Remove')[$action.SelectedIndex]};return $InitialAction}
function Localize61 {
 $selected=Action61;$items=@();foreach($a in @('Install','Repair','Remove')){$text=switch($a){'Install'{T 'Install' 'نصب وارنا'}'Repair'{T 'Repair existing installation' 'تعمیر نصب قبلی'}'Remove'{T 'Uninstall' 'حذف وارنا'}};$items+=$text}
 $action.Items.Clear();foreach($i in $items){[void]$action.Items.Add($i)};for($i=0;$i -lt $action.Items.Count;$i++){if(@('Install','Repair','Remove')[$i] -eq $selected){$action.SelectedIndex=$i}}
 $action.Enabled=$InitialAction -ne 'Remove'
 foreach($label in @($title,$mode,$info,$note,$status)){$label.RightToLeft=if($script:lang -eq 'fa'){'Yes'}else{'No'};$label.TextAlign=if($script:lang -eq 'fa'){'MiddleRight'}else{'MiddleLeft'}}
 $title.Text=T 'Install Varna' 'نصب وارنا'
 $inspect.Text=T 'Check system' 'بررسی سیستم';$start.Text=T 'Install' 'نصب';$cancel.Text=T 'Cancel operation' 'لغو عملیات';$openLogs.Text=T 'Open logs' 'نمایش گزارش‌ها';$close.Text=T 'Close' 'بستن';$guide.Text=T 'Guide' 'راهنما'
 $downloadInfo.Text=T 'Downloads: measured bytes, speed and remaining time appear here.' 'دانلود: حجم، سرعت و زمان باقی‌ماندهٔ واقعی اینجا نمایش داده می‌شود.'
 $note.Text=T 'Per-user setup. User settings and models are kept unless explicitly selected for removal.' 'نصب برای حساب فعلی؛ تنظیمات و مدل‌ها بدون انتخاب صریح حذف نمی‌شوند.'
 $summary.Text=T 'Select the destination application. Add Varna engine only if you need sound generation.' 'نرم‌افزار مقصد را انتخاب کن. موتور وارنا فقط برای ساخت صدا لازم است.'
 Mode61
}
function Mode61 {
 $start.Text=switch(Action61){'Remove'{T 'Uninstall' 'حذف'}'Repair'{T 'Repair' 'تعمیر'}default{T 'Install' 'نصب'}}
 $remove=(Action61) -eq 'Remove';$clearCache.Visible=$remove
 $engine.Text=if($remove){T 'Also remove Varna engine and its models' 'حذف موتور وارنا و مدل‌های آن'}else{T 'Add Varna engine for sound generation' 'افزودن موتور وارنا برای ساخت صدا (اختیاری)'}
 $clearCache.Text=T 'Delete downloaded setup files' 'حذف فایل‌های دانلودشدهٔ نصب'
 $mode.Text=if($remove){T 'Choose the items you want to remove.' 'مواردی را که می‌خواهی حذف شوند انتخاب کن.'}else{T 'Choose the application, then click Install.' 'نرم‌افزار مقصد را انتخاب کن، سپس نصب را بزن.'}
 $info.Text=if($remove){T 'Engine removal requires a scan and confirmation of exact paths; linked model targets are preserved.' 'حذف موتور نیاز به اسکن و تأیید مسیرها دارد؛ مقصد لینک مدل‌ها حفظ می‌شود.'}else{T 'Text, motion and tables work without Varna engine. Sound generation needs NVIDIA and a separate model.' 'متن، موشن و جدول به موتور نیاز ندارند. ساخت صدا به NVIDIA و مدل جدا نیاز دارد.'}
}
function FailureText62([string]$message){
 switch -Regex ($message){
 'Close .*applications|Close these'{return (T 'Close Adobe/Resolve applications and try again.' 'افتر، پریمیر و داوینچی را ببند و دوباره تلاش کن.')}
 'requires NVIDIA'{return (T 'Varna engine needs NVIDIA. Disable the engine option to install the other tools.' 'موتور وارنا به NVIDIA نیاز دارد؛ برای نصب بقیهٔ ابزارها، تیک موتور را بردار.')}
 'checksum|verification failed'{return (T 'Downloaded files did not pass validation. Retry to receive a verified copy.' 'سلامت فایل دانلودشده تأیید نشد؛ دوباره تلاش کن تا نسخهٔ سالم دریافت شود.')}
 'timed out|connection|resolve host|Response status code'{return (T 'Download could not connect. Check the internet and retry; partial files are kept.' 'اتصال دانلود برقرار نشد؛ اینترنت را بررسی و دوباره تلاش کن. فایل نیمه‌کاره حفظ شده است.')}
 'Access.*denied|UnauthorizedAccess'{return (T 'Windows denied file access. Close programs using the files and inspect the saved log.' 'ویندوز اجازهٔ تغییر فایل را نداد؛ برنامه‌های مرتبط را ببند و گزارش خطا را بررسی کن.')}
 'Incomplete package|dependency'{return (T 'Setup files are incomplete. Download the current installer again.' 'فایل‌های نصب کامل نیستند؛ نسخهٔ جدید نصب‌کننده را دوباره دریافت کن.')}
 'Unrecognized existing'{return (T 'An unknown installation was found and preserved. See technical details.' 'یک نصب ناشناخته پیدا شد و برای حفظ فایل‌ها تغییر نکرد؛ جزئیات فنی را ببین.')}
 default{return (T 'The operation could not finish. Your log is saved; open technical details for the cause.' 'عملیات کامل نشد؛ گزارش ذخیره شده است. برای علت خطا «جزئیات فنی» را باز کن.')}
 }
}
function FriendlyStatus62($state){
 $phase=[string]$state.phase
 $text=switch($phase){
 'Inspect'{T 'Checking your computer…' 'در حال بررسی سیستم…'}
 'Inspected'{if((Action61) -eq 'Remove'){T 'Choose what you want to remove, then click Uninstall.' 'موارد حذف را انتخاب کن، سپس حذف را بزن.'}else{T 'Choose the destination application, then continue.' 'مقصد نصب را انتخاب کن، سپس نصب یا تعمیر را بزن.'}}
 'Download'{T 'Downloading Varna files…' 'در حال دریافت فایل‌های وارنا…'}
 'Extract'{T 'Preparing the downloaded files…' 'در حال آماده‌سازی فایل‌ها…'}
 'Verify'{T 'Checking downloaded files…' 'در حال بررسی سلامت فایل‌ها…'}
 'Engine'{T 'Preparing Varna engine…' 'در حال آماده‌سازی موتور وارنا…'}
 'Install'{T 'Installing Varna…' 'در حال نصب وارنا…'}
 'Removing'{T 'Removing selected items…' 'در حال حذف موارد انتخاب‌شده…'}
 'Complete'{T 'Done. You can close this window.' 'انجام شد؛ می‌توانی این پنجره را ببندی.'}
 'Cancelled'{T 'Cancelled. Downloaded parts are kept for retry.' 'لغو شد؛ فایل‌های دریافت‌شده برای ادامه حفظ شدند.'}
 'Failed'{FailureText62 ([string]$state.message)}
 default{T 'Working…' 'در حال انجام…'}
 }
 $steps=switch(Action61){
 'Remove'{T "1. Find installed items`r`n`r`n2. Select what to remove`r`n`r`n3. Remove selected items`r`n`r`n4. Finish" "۱. شناسایی موارد نصب‌شده`r`n`r`n۲. انتخاب موارد حذف`r`n`r`n۳. حذف موارد انتخاب‌شده`r`n`r`n۴. پایان"}
 'Repair'{T "1. Check existing installation`r`n`r`n2. Receive verified files`r`n`r`n3. Repair Varna files`r`n`r`n4. Finish" "۱. بررسی نصب قبلی`r`n`r`n۲. دریافت فایل‌های سالم`r`n`r`n۳. تعمیر فایل‌های وارنا`r`n`r`n۴. پایان"}
 default{T "1. Check the computer`r`n`r`n2. Receive setup files`r`n`r`n3. Install Varna`r`n`r`n4. Finish" "۱. بررسی سیستم`r`n`r`n۲. دریافت فایل‌های نصب`r`n`r`n۳. نصب وارنا`r`n`r`n۴. پایان"}
 }
 $summary.Text=$steps+"`r`n`r`n"+$text

 return $text
}
function Busy61([bool]$busy){foreach($c in @($inspect,$start,$language,$engine,$clearCache)+@($hostChecks.Values)){$c.Enabled=!$busy};$action.Enabled=(!$busy -and $InitialAction -ne 'Remove');$cancel.Enabled=$busy;$close.Enabled=!$busy}
function Begin61([string]$kind){
 if($script:job -and !$script:job.HasExited){return}
 $selected=@(@('AE','Premiere','Resolve')|Where-Object {$hostChecks[$_].Checked})
 $paths=@();$confirm=$false
 if($kind -eq 'Remove' -and $engine.Checked){
  if(!$script:scanReady){[Windows.Forms.MessageBox]::Show((T 'Check system with engine search selected first.' 'ابتدا با انتخاب جستجوی موتور، بررسی سیستم را اجرا کن.'),'Varna');return}
  $paths=@($script:inventory.engines|ForEach-Object {$_.Path})
  if($paths.Count){$message=(T "Permanently delete these engine folders AND their internal model files? Linked external targets are kept.`r`n`r`n" "این پوشه‌های موتور و فایل مدل‌های داخلشان برای همیشه حذف شوند؟ مقصد لینک‌های بیرونی حفظ می‌شود.`r`n`r`n")+($paths -join "`r`n");if([Windows.Forms.MessageBox]::Show($message,'Varna | Engine removal','YesNo','Warning') -ne 'Yes'){return};$confirm=$true}
 }
 if($kind -ne 'Inspect' -and !$selected.Count -and !$paths.Count -and !($kind -eq 'Remove' -and $InitialAction -eq 'Remove')){[Windows.Forms.MessageBox]::Show((T 'Select at least one component.' 'حداقل یک مؤلفه انتخاب کن.'),'Varna');return}
 if($kind -eq 'Remove' -and $selected.Count){if([Windows.Forms.MessageBox]::Show(((T 'Remove these panels from their hosts? Recovery copies and user data are kept: ' 'این پنل‌ها از میزبان حذف شوند؟ نسخهٔ بازیابی و داده‌های کاربر حفظ می‌شوند: ')+($selected -join ', ')),'Varna','YesNo','Question') -ne 'Yes'){return}}
 $script:session=Join-Path $logsRoot ((Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[guid]::NewGuid().ToString('N').Substring(0,8));New-Item -ItemType Directory $script:session -Force|Out-Null
 $script:requestPath=Join-Path $script:session 'request.json';$script:statusPath=Join-Path $script:session 'status.json';$script:outPath=Join-Path $script:session 'details.log';$script:errPath=Join-Path $script:session 'errors.log';$script:cancelPath=Join-Path $script:session 'cancel.request'
 $request=@{action=$kind;hosts=$selected;engine=$engine.Checked;scanEngines=($kind -eq 'Inspect' -and (Action61) -eq 'Remove' -and $engine.Checked);enginePaths=$paths;confirmEngineRemoval=$confirm;allowManagerOnly=($InitialAction -eq 'Remove');clearCache=$clearCache.Checked}
 $request|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $script:requestPath -Encoding UTF8
 $env:VARNA_CANCEL_FILE=$script:cancelPath;$env:VARNA_INSTALL_LOG=Join-Path $script:session 'download-and-install.log'
 $arguments='-NoLogo -NoProfile -ExecutionPolicy Bypass -File "'+(Join-Path $PSScriptRoot 'Backend61.ps1')+'" -RequestFile "'+$script:requestPath+'" -StatusFile "'+$script:statusPath+'" -SpecFile "'+(Join-Path $PSScriptRoot 'package-lock61.json')+'"'
 $details.Clear();$script:lastText='';$downloadBar.Value=0;$status.Text=T 'Starting…' 'در حال شروع…';Busy61 $true
 try{$script:job=Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput $script:outPath -RedirectStandardError $script:errPath;[void]$script:job.Handle;$script:jobKind=$kind;$script:requestedScan=$request.scanEngines}catch{Busy61 $false;$status.Text=$_.Exception.Message}
}
$timer=New-Object Windows.Forms.Timer;$timer.Interval=500
$timer.Add_Tick({
 if(!$script:job){return}
 try{
  $text='';foreach($file in @($script:outPath,$script:errPath)){if(Test-Path -LiteralPath $file){$stream=[IO.File]::Open($file,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::ReadWrite);try{$reader=New-Object IO.StreamReader($stream,[Text.Encoding]::UTF8,$true);$text+=$reader.ReadToEnd()}finally{if($reader){$reader.Dispose()}else{$stream.Dispose()}}}}
  if($text -ne $script:lastText){$script:lastText=$text;$details.Text=if($text.Length -gt 120000){$text.Substring($text.Length-120000)}else{$text};$details.SelectionStart=$details.TextLength;$details.ScrollToCaret()}
  $transfers=[regex]::Matches($text,'(?m)([^\r\n|]+)\s*\|\s*([\d.,]+) / ([\d.,]+) MiB \| (\d+)% \| ([\d.,]+) MiB/s \| ETA ([\d:]+)')
  if($transfers.Count){$m=$transfers[$transfers.Count-1];$downloadInfo.Text=(T 'Download' 'دانلود')+' | '+$m.Groups[2].Value+' / '+$m.Groups[3].Value+' MiB | '+$m.Groups[5].Value+' MiB/s | '+(T 'Remaining ' 'باقی‌مانده ')+$m.Groups[6].Value;$downloadBar.Value=[Math]::Min(100,[int]$m.Groups[4].Value)}
  $stages=[regex]::Matches($text,'(?m)^\[(\d+)% \| ([^\]]+)\] ([^\r\n]+)');if($stages.Count){$stageInfo.Text=(T 'Current stage: ' 'پیشرفت مرحلهٔ جاری: ')+$stages[$stages.Count-1].Groups[1].Value+'%'}
  $state=$null;if(Test-Path -LiteralPath $script:statusPath){$state=Get-Content -LiteralPath $script:statusPath -Raw -Encoding UTF8|ConvertFrom-Json;$status.Text=FriendlyStatus62 $state}
  if(!$script:job.HasExited){return}
  $script:job.WaitForExit();$code=$script:job.ExitCode;$script:job=$null;Busy61 $false
  if($state.data.completed.Count -gt 0){$script:changed=$true;[IO.File]::WriteAllText($ResultPath,"[Result]`r`nChanged=1`r`nSuccess=0`r`n")}
  if($state.phase -eq 'Inspected'){
   $script:inventory=$state.data;$script:scanReady=$script:requestedScan
   $summaryRows=@();foreach($h in @('AE','Premiere','Resolve')){$entry=$script:inventory.hosts.$h;$displayHost=@{AE=(T 'After Effects' 'افتر');Premiere=(T 'Premiere' 'پریمیر');Resolve=(T 'DaVinci Resolve' 'داوینچی')}[$h];$summaryRows+=($displayHost+': '+$(if($entry.owned){T 'installed' 'نصب‌شده'}elseif($entry.exists){T 'unrecognized; preserved' 'ناشناخته؛ حفظ می‌شود'}else{T 'absent' 'موجود نیست'}));if($script:firstInspect -and $InitialAction -eq 'Remove'){$hostChecks[$h].Checked=$entry.owned}}
   $info.Text=($summaryRows -join ' | ')+' | '+[Math]::Round($script:inventory.freeBytes/1GB,1)+(T ' GiB free' ' گیگابایت فضای خالی');$details.AppendText("`r`n"+($script:inventory|ConvertTo-Json -Depth 10));$script:firstInspect=$false
  }elseif($state.phase -eq 'Complete' -and $code -eq 0){
   $script:success=$true;$script:lastAction=$script:jobKind;$close.Text=T 'Finish' 'پایان';$status.ForeColor=$accent
   [IO.File]::WriteAllText($ResultPath,"[Result]`r`nAction="+$script:lastAction+"`r`nSuccess=1`r`nChanged=1`r`n")
  }else{$script:success=$false;$status.ForeColor=[Drawing.Color]::Salmon;if(!$state){$status.Text=T 'The worker stopped. Open logs for details.' 'عملیات متوقف شد؛ گزارش خطا را باز کن.'};[Windows.Forms.MessageBox]::Show(($status.Text+"`r`n`r`n"+(T 'Logs: ' 'گزارش: ')+$script:session),'Varna','OK','Warning')}
 }catch{$status.Text=$_.Exception.Message}
})
$inspect.Add_Click({Begin61 'Inspect'});$start.Add_Click({Begin61 (Action61)})
$cancel.Add_Click({if($script:job){[IO.File]::WriteAllText($script:cancelPath,'cancel');$cancel.Enabled=$false;$status.Text=T 'Cancellation requested. Waiting for a safe checkpoint; partial downloads are kept.' 'درخواست لغو ثبت شد؛ تا نقطهٔ امن منتظر بمان. فایل نیمه‌کاره حفظ می‌شود.'}})
$technical.Add_LinkClicked({$summary.Visible=!$summary.Visible;if(!$summary.Visible){$details.BringToFront()};$technical.BringToFront()})
$openLogs.Add_Click({$path=if($script:session){$script:session}else{$logsRoot};Start-Process explorer.exe -ArgumentList ('"'+$path+'"')})
$guide.Add_Click({Start-Process notepad.exe -ArgumentList ('"'+(Join-Path $PSScriptRoot 'README_FA.md')+'"')})
$close.Add_Click({$form.Close()})
$language.Add_SelectedIndexChanged({$script:lang=if($language.SelectedIndex -eq 0){'fa'}else{'en'};Localize61})
$action.Add_SelectedIndexChanged({$script:scanReady=$false;Mode61});$engine.Add_CheckedChanged({$script:scanReady=$false})
$form.Add_FormClosing({param($sender,$e);if($script:job -and !$script:job.HasExited){$e.Cancel=$true;[Windows.Forms.MessageBox]::Show((T 'Use Cancel and wait for the current safe checkpoint.' 'ابتدا لغو عملیات را بزن و تا پایان مرحلهٔ امن منتظر بمان.'),'Varna')}})
Localize61
for($i=0;$i -lt $action.Items.Count;$i++){if(@('Install','Repair','Remove')[$i] -eq $InitialAction){$action.SelectedIndex=$i}}
$form.Add_Shown({$timer.Start();Begin61 'Inspect'})
[void]$form.ShowDialog();$timer.Stop();$timer.Dispose();$picture.Image.Dispose();$form.Dispose()
if($script:success){exit 0}else{exit 2}
