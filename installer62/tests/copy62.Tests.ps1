$ErrorActionPreference='Stop'
$file=Join-Path $PSScriptRoot '../../installer61/Gui61.ps1';$t=$null;$e=$null;$ast=[Management.Automation.Language.Parser]::ParseFile($file,[ref]$t,[ref]$e);if($e.Count){throw ($e|Out-String)}
$script:lang='fa';$action=[pscustomobject]@{SelectedIndex=0};$summary=[pscustomobject]@{Text=''}
foreach($name in @('T','Action61','FailureText62','FriendlyStatus62')){
 $fn=$ast.Find({param($n)$n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true);if(!$fn){throw ('Missing UI function: '+$name)};Invoke-Expression $fn.Extent.Text
}
$ready=FriendlyStatus62 ([pscustomobject]@{phase='Inspected';message='raw';data=$null});if($ready -notmatch 'مقصد نصب'){throw 'Install readiness unclear'}
$action.SelectedIndex=2;$ready=FriendlyStatus62 ([pscustomobject]@{phase='Inspected';message='raw';data=$null});if($ready -notmatch 'حذف' -or $summary.Text -notmatch 'شناسایی موارد نصب‌شده'){throw 'Removal instructions incorrectly use install steps'}
$action.SelectedIndex=1;[void](FriendlyStatus62 ([pscustomobject]@{phase='Install';message='raw';data=$null}));if($summary.Text -notmatch 'تعمیر فایل‌های وارنا'){throw 'Repair instructions missing'}
if((FailureText62 'Automatic engine requires NVIDIA') -notmatch 'تیک موتور را بردار'){throw 'GPU error lacks actionable guidance'}
if((Get-Content -LiteralPath $file -Raw -Encoding UTF8) -match 'ComfyUI'){throw 'Upstream engine name leaked into setup UI copy'}
Write-Host 'PASS62 actual UI-copy functions: distinct install/repair/removal steps, Persian actionable errors and no ComfyUI display name. Native Windows layout remains untested.'
