var net = require('net');
var Q = require('q');
var SctpClient = require('../sc-network');

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

  // test client there
  var context = new Array(100);
  unit_test(client.create_node(SctpClient.sc_type_const), "create_node", null, context, 0);
  var node_addr = context[0];
  unit_test(client.create_link(), "create_link", null, context, 1);
  var link_addr = context[1];

  var node1, node2;
  Q.all([
    client.create_node(SctpClient.sc_type_const).then(function(addr) { node1 = addr; }),
    client.create_node(SctpClient.sc_type_const).then(function(addr) { node2 = addr; })
  ]).then(function() {
      unit_test(client.create_arc(SctpClient.sc_type_arc_pos_const_perm, node1, node2), "create_arc", null, context, 3);
  });

});
