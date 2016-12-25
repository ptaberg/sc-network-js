const Q = require('q');
const ScType = require('./sc-types');

var keynodes = {};

function ScHelperImpl(sctp_client, sctp_keynodes) {

  _getSystemIdentifierImpl = function(addr) {
      var dfd = new Q.defer();

      var self = this;
      sctp_client.iterate_elements(ScType.SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                        [
                                         addr,
                                         ScType.sc_type_arc_common | ScType.sc_type_const,
                                         ScType.sc_type_link,
                                         ScType.sc_type_arc_pos_const_perm,
                                         keynodes.nrel_system_identifier
                                        ])
      .then((it) => {
          sctp_client.get_link_content(it[0][2])
            .then((res) => {
              dfd.resolve(res);
            }, dfd.reject);
      }, dfd.reject);

      return dfd.promise;
  };

  function _initImpl() {
    var dfd = new Q.defer();

    sctp_keynodes.resolveKeynodes([
      'nrel_system_identifier'
    ]).then((result) => {
      keynodes = result;
      dfd.resolve();
    }, dfd.reject);

    return dfd.promise;
  }
  return {
    init: _initImpl,
    getSystemIdentifier: _getSystemIdentifierImpl
  }
}

module.exports = ScHelperImpl;
