const net = require('net');
const Q = require('q');
const SctpClient = require('../sc-network');
const ScType = require('../sc-types');
const ScHelper = require('../sc-helper');

var host = "localhost";
var port = 55770;

function unit_test(promise, name, result, context, index) {
  promise.then(function(res) {
    if (result == null)
      result = res;
    var res_str = 'fail';
    if (result === res)
      res_str = 'ok';

    console.log("Test: " + name + " - result ... " + res_str);
    context[index] = res;
  });
}

var socket = new net.Socket();
socket.connect(port, host, function() {
	console.log('Connected');
  var client = new SctpClient.SctpClient(socket);
  var keynodes = new SctpClient.Keynodes(client);

  // test keynodes
  console.log('resolve_keynodes');
  var test_keynodes = {
    nrel_main_idtf: null,
    lang_ru: null,
    lang_en: null
  };
  keynodes.resolveKeynodes(test_keynodes).then(function (result) {
    console.log(result);
    for (var p in result) {
      if (result.hasOwnProperty(p)) {
        var idtf = p;
        var res_str = 'ok';
        var res = result[p];
        if (res == undefined || res == null || res == 0)
          res_str = 'fail';
        console.log('\t' + p + " ... " + res_str);
      }
    }
  });

  // test client there
  var context = new Array(100);
  unit_test(client.create_node(ScType.sc_type_const), "create_node", null, context, 0);
  var node_addr = context[0];
  unit_test(client.create_link(), "create_link", null, context, 1);
  var link_addr = context[1];

  var node1, node2;
  Q.all([
    client.create_node(ScType.sc_type_const).then(function(addr) { node1 = addr; }),
    client.create_node(ScType.sc_type_const).then(function(addr) { node2 = addr; })
  ]).then(function() {
      unit_test(client.create_arc(ScType.sc_type_arc_pos_const_perm, node1, node2), "create_arc", null, context, 3);
  });

  // test helper
  var helper = new ScHelper(client, keynodes);
  var printFail = function(name) { console.log("Test " + name + " failed"); }

  helper.init().then(() => {
    keynodes.resolveKeynodes(['nrel_system_identifier'])
      .then((result) => {
        helper.getSystemIdentifier(result.nrel_system_identifier)
          .then((idtf) => {
            if (idtf != 'nrel_system_identifier') {
              console.log("ScHelper.getSystemIdentifier failed got " + idtf);
            } else {
              console.log("ScHelper.getSystemIdentifier OK - " + idtf);
            }
          }, () => {
            printFail("ScHelper.getSystemIdentifier");
          });
      }, () => {
        printFail("ScKeynodes.resolveKeynodes");
      });
  }, () => {
    console.log("ScHelper.init error");
  });

});
