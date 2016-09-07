var Q = require('q');

function ScKeynodesImpl(sctp_client) {
  var client = sctp_client;
  var cache = {};

  return {
    /* Resolve specified keynodes by their system identifiers
     * Params:
     * - keynodes - array of system identifiers to resolve sc-elements
     * Return:
     * - returns dictionary, where keys - system identifier; values - sc-addrs of specified sc-elements
     */
    resolveKeynodes: function(keynodes) {

      function resolveKeynodeImpl(keynode_idtf) {
        var dfd = new Q.defer();
        var value = cache[keynode_idtf];
        if (value) {
          dfd.resolve([keynode_idtf, value]);
        } else {
          client.find_element_by_system_identifier(keynode_idtf).then(function(addr) {
            if (addr) {
              cache[keynode_idtf] = addr;
            }
            dfd.resolve([keynode_idtf, addr]);
          });
        }
        return dfd.promise;
      }

      var dfd_global = new Q.defer();
      var promises = [];
      for (var i = 0; i < keynodes.length; ++i)
        promises.push(resolveKeynodeImpl(keynodes[i]));

      Q.all(promises).then(function(results) {
        var resolved = {};
        for (var i = 0; i < results.length; ++i) {
          resolved[results[i][0]] = results[i][1];
        }
        dfd_global.resolve(resolved);
      });

      return dfd_global.promise;
    }
  };
} // createImpl

module.exports = ScKeynodesImpl;
