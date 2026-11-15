/*  AmanowTools — ScriptPath for the floating card window.

    Deliberately empty.

    CEP evaluates a ScriptPath into After Effects' ONE shared ExtendScript
    scope. The floating window used to declare host.jsx here, so every time it
    opened, all 262 KB of it were parsed and executed again on AE's script
    thread — blocking AE, and resetting globals the docked panel was in the
    middle of using.

    The panel loads host.jsx when it starts, and everything in it is already in
    the shared scope by the time this window can exist. Cards opened here call
    the same functions and reach the same code.

    Do not put anything in this file.
*/
