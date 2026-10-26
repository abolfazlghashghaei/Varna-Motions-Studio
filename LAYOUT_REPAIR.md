# Liquid48 package layout recovery

The reported manual FULL archive contained the payload directly in `Varna_Motion_Studio`. Applying an overlay with a repository wrapper inside that payload created another `Varna_Motion_Studio` directory. The wrapper restored the Git LFS file there, then launched a partial child folder containing no `INSTALL_WINDOWS.ps1`. A blind parent fallback would also leave the updated UI and manifest in the wrong directory.

The standalone repair ZIP contains the complete current non-asset payload and a pinned package manifest. Its unique entry point is `REPAIR_AND_INSTALL_WINDOWS.bat`. Extract this ZIP as a new subfolder inside the original extracted package and run that BAT. If the package cannot be determined unambiguously, select the original extracted base folder in the Windows folder picker.

Recovery verifies all files before staging, finds existing assets in the actual base and the partial nested update, reuses the verified component or its verified cache, and builds a complete sibling folder named `v48-<id>`. It copies only manifest entries, including the original native installer and all Liquid48 code. Source files are never overwritten. Corrupt or missing assets stop recovery instead of weakening checksum checks. Failed preparation removes only its newly created staging folder. Installation then invokes the verified backend from the ready folder with the selected Core/Studio/Max level. The native backend retains its normal validation, ownership and rollback behavior.

Both standard BAT entry points now reject a missing backend before attempting preparation or invoking PowerShell with a nonexistent script path.

## Executed validation

- Eight actual PowerShell filesystem scenarios: repository wrapper, direct payload, partial child and extracted repair-folder resolution; the reported nested installer omission; reuse of an already verified child component and cached download; complete sibling preparation without source mutation; cleanup after injected copy refusal; corrupt/missing asset rejection; manifest pin enforcement; ambiguous package rejection.
- All six existing component restoration/rollback scenarios passed.
- A real-size regression fixture combined the initial RC47 base with the incorrectly nested Liquid48 overlay and the already verified component. Recovery verified all 3159 sources, built a complete sibling package and preserved the incorrect nested source tree for review. The prepared package passed all 3159 source size/hash checks and installer ownership/rollback checks.
- PowerShell scripts were parsed and executed with the SHA-256-verified official portable PowerShell runtime on Linux. Native Windows/After Effects execution remains untested here.
