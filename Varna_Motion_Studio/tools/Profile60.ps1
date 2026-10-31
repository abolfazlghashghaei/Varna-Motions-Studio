param([Parameter(Mandatory=$true)][string]$Target,[bool]$Enabled=$true)
$ErrorActionPreference='Stop'
$js=if($Enabled){'window.VARNA_ENGINE_ENABLED=true;'}else{@'
window.VARNA_ENGINE_ENABLED=false;
document.addEventListener('DOMContentLoaded',function(){
 document.querySelectorAll('#brainMusic,#audioStudio50,#page-music,[data-page="music"],[data-launch="music"]').forEach(function(e){e.remove();});
});
'@}
[IO.File]::WriteAllText((Join-Path $Target 'engine-profile60.js'),$js)
foreach($file in Get-ChildItem -LiteralPath $Target -Filter '*.html'){
 $html=[IO.File]::ReadAllText($file.FullName)
 $html=$html.Replace('<head>','<head><script src="engine-profile60.js"></script>')
 if(!$Enabled){foreach($name in @('audio50','audio51','music-engine')){$html=[regex]::Replace($html,'<script\s+src="(?:\./)?js/'+$name+'\.js"\s*></script>','')}}
 [IO.File]::WriteAllText($file.FullName,$html)
}
if(!$Enabled){foreach($name in @('audio50','audio51','music-engine')){Remove-Item -LiteralPath (Join-Path $Target ('js\'+$name+'.js')) -Force -ErrorAction SilentlyContinue}}
