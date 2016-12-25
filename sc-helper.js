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

  _getIdentifierImpl = function(addr, lang) {
    var dfd = new Q.defer();

    var get_sys = function() {

      _getSystemIdentifier(addr).then(dfd.resolve, dfd.reject);
    };

    sctp_client.iterate_constr(
      ScType.SctpConstrIter(ScType.SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                    [addr,
                     ScType.sc_type_arc_common | ScType.sc_type_const,
                     ScType.sc_type_link,
                     ScType.sc_type_arc_pos_const_perm,
                     keynodes.nrel_main_idtf
                    ],
                    {"x": 2}),
      ScType.SctpConstrIter(ScType.SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                     [lang,
                      ScType.sc_type_arc_pos_const_perm,
                      "x"
                     ])
    ).then((results) => {
      var link_addr = results.get(0, "x");
      sctp_client.get_link_content(link_addr)
        .then(dfd.resolve, dfd.reject);
    }, () => {
      get_sys();
    });

    return dfd.promise;
  };

  function _initImpl() {
    var dfd = new Q.defer();

    sctp_keynodes.resolveKeynodes([
      'nrel_system_identifier',
      'nrel_main_idtf'
    ]).then((result) => {
      keynodes = result;
      dfd.resolve();
    }, dfd.reject);

    return dfd.promise;
  }
  return {
    init: _initImpl,

    /*! Function to get system identifier
     * @param addr sc-addr of element to get system identifier
     * @returns Returns promise object, that resolves with found system identifier.
     * If there are no system identifier, then promise rejects
     */
    getSystemIdentifier: _getSystemIdentifierImpl,

    /*! Function to get element identifer
     * @param addr sc-addr of element to get identifier
     * @param lang sc-addr of language
     * @returns Returns promise object, that resolves with found identifier.
     * If there are no any identifier, then promise rejects
     */
    getIdentifier: _getIdentifierImpl
  }
}

module.exports = ScHelperImpl;
