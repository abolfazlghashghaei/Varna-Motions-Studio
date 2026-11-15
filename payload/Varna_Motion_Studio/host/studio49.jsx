/* Additional tools load only on explicit use; no changes to the proven RC47 boot. */
(function () {
  var root = File($.fileName).parent.parent.fsName;
  var base = root + '/assets/vendor/rebound49/host/';
  $.evalFile(new File(base + 'lib/json.jsx'));
  $.evalFile(new File(base + 'lib/core.jsx'));
  $.evalFile(new File(base + 'lib/util.jsx'));
  $.evalFile(new File(base + 'commands/ease.jsx'));
  // Keep upstream functions private; bare ping/execute names never enter the host.
  var conjure = (function () {
    var contextFile = new File(root + '/assets/vendor/conjure49/host/introspect.jsx');
    var executeFile = new File(root + '/assets/vendor/conjure49/host/execute.jsx');
    function read(file) { if (!file.open('r')) throw Error('Tool source missing: ' + file.name); try { return file.read(); } finally { file.close(); } }
    return eval('(function(){' + read(contextFile) + '\n' + read(executeFile) + '\nreturn {context:introspectComp,execute:executeScript};})()');
  })();
  var api = { revision: 1 };
  api.dispatch = function (method, args) {
    try {
      args = args || {};
      if (method === 'ease.apply' || method === 'ease.read') {
        if (method === 'ease.apply') {
          var c = args.curve;
          if (!c) throw Error('Curve is required');
          for (var k in c) if (c.hasOwnProperty(k) && (typeof c[k] !== 'number' || !isFinite(c[k]) || Math.abs(c[k]) > 10)) throw Error('Invalid curve value');
          for (var i = 0; i < 4; i++) if (typeof c[['x1','y1','x2','y2'][i]] !== 'number') throw Error('Incomplete curve');
          if (args.scope !== 'inout' && args.scope !== 'in' && args.scope !== 'out') throw Error('Invalid curve scope');
          args.applyToAll = false;
        }
        return $.__varnaRebound49.dispatch(method, JSON.stringify(args));
      }
      if (method === 'assistant.context') {
        var context = JSON.parse(conjure.context());
        if (!context.success) throw Error(context.error);
        return JSON.stringify({ok:true,data:context});
      }
      if (method === 'assistant.execute') {
        if (typeof args.code !== 'string' || !args.code.replace(/\s/g,'') || args.code.length > 200000) throw Error('Script is empty or too large');
        var result = JSON.parse(conjure.execute(args.code, 'Varna Assistant'));
        if (!result.success) throw Error(result.error + (result.line ? ' (line ' + result.line + ')' : ''));
        return JSON.stringify({ok:true,data:result});
      }
      if (method === 'assistant.undo') { app.executeCommand(16); return JSON.stringify({ok:true,data:{success:true}}); }
      throw Error('Unknown studio tool');
    } catch (e) { return JSON.stringify({ok:false,error:{message:String(e.message || e)}}); }
  };
  $.global.VarnaStudio49 = api;
})();
