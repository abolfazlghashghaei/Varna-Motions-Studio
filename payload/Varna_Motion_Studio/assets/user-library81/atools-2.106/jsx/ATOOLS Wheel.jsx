/*  ATOOLS Wheel — открыть колесо AmanowTools
 *
 *  Этот файл кладётся в папку скриптов After Effects. После перезапуска AE он
 *  появляется в меню File -> Scripts, и там же его видит редактор сочетаний
 *  клавиш (Edit -> Keyboard Shortcuts) — можно повесить любую клавишу.
 *
 *  Что он делает: отправляет расширению AmanowTools событие CSXS. Панель ловит
 *  его и открывает колесо. Никакой фоновой программы, никаких системных
 *  разрешений — механизм встроен в сам After Effects и работает одинаково на
 *  Windows и на macOS.
 *
 *  Файл намеренно крошечный: он выполняется на каждое нажатие клавиши, поэтому
 *  не должен ничего считать, читать с диска или ждать.
 */
(function () {

    /* PlugPlugExternalObject — это мост между ExtendScript и панелями CEP.
       Библиотека входит в состав After Effects, ставить её не надо. */
    var lib = null;
    try {
        lib = new ExternalObject("lib:PlugPlugExternalObject");
    } catch (eLib) {
        alert("AmanowTools\n\nНе удалось связаться с панелью: в этой версии After Effects\n" +
              "нет модуля PlugPlugExternalObject.\n\n" + eLib.toString());
        return;
    }

    /* Если панель закрыта, ловить событие некому. Открываем её через меню
       Window -> Extensions -> AmanowTools: имя пункта совпадает с именем
       расширения в манифесте. На локализованном интерфейсе поиск может не
       найти пункт — тогда просто шлём событие, панель обычно уже открыта. */
    try {
        var mid = app.findMenuCommandId("AmanowTools");
        if (mid) app.executeCommand(mid);
    } catch (eMenu) {}

    try {
        var ev = new CSXSEvent();
        ev.type = "com.amanow.tools.wheel";
        ev.scope = "APPLICATION";
        ev.data = "hotkey";
        ev.dispatch();
    } catch (eSend) {
        alert("AmanowTools\n\nНе удалось отправить сигнал панели.\n\n" + eSend.toString());
    }

})();
