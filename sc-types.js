// sc-element types
var sc_type_node = 0x1
var sc_type_link = 0x2
var sc_type_edge_common = 0x4
var sc_type_arc_common = 0x8
var sc_type_arc_access = 0x10

// sc-element constant
var sc_type_const = 0x20
var sc_type_var = 0x40

// sc-element positivity
var sc_type_arc_pos = 0x80
var sc_type_arc_neg = 0x100
var sc_type_arc_fuz = 0x200

// sc-element premanently
var sc_type_arc_temp = 0x400
var sc_type_arc_perm = 0x800

// struct node types
var sc_type_node_tuple = (0x80)
var sc_type_node_struct = (0x100)
var sc_type_node_role = (0x200)
var sc_type_node_norole = (0x400)
var sc_type_node_class = (0x800)
var sc_type_node_abstract = (0x1000)
var sc_type_node_material = (0x2000)


var sc_type_arc_pos_const_perm = (sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm)

// type mask
var sc_type_element_mask = (sc_type_node | sc_type_link | sc_type_edge_common | sc_type_arc_common | sc_type_arc_access)
var sc_type_constancy_mask = (sc_type_const | sc_type_var)
var sc_type_positivity_mask = (sc_type_arc_pos | sc_type_arc_neg | sc_type_arc_fuz)
var sc_type_permanency_mask = (sc_type_arc_perm | sc_type_arc_temp)
var sc_type_node_struct_mask = (sc_type_node_tuple | sc_type_node_struct | sc_type_node_role | sc_type_node_norole | sc_type_node_class | sc_type_node_abstract | sc_type_node_material)
var sc_type_arc_mask = (sc_type_arc_access | sc_type_arc_common | sc_type_edge_common)

var SctpCommandType = {
    SCTP_CMD_UNKNOWN:           0x00, // unkown command
    SCTP_CMD_CHECK_ELEMENT:     0x01, // check if specified sc-element exist
    SCTP_CMD_GET_ELEMENT_TYPE:  0x02, // return sc-element type
    SCTP_CMD_ERASE_ELEMENT:     0x03, // erase specified sc-element
    SCTP_CMD_CREATE_NODE:       0x04, // create new sc-node
    SCTP_CMD_CREATE_LINK:       0x05, // create new sc-link
    SCTP_CMD_CREATE_ARC:        0x06, // create new sc-arc
    SCTP_CMD_GET_ARC:           0x07, // return begin element of sc-arc

    SCTP_CMD_GET_LINK_CONTENT:  0x09, // return content of sc-link
    SCTP_CMD_FIND_LINKS:        0x0a, // return sc-links with specified content
    SCTP_CMD_SET_LINK_CONTENT:  0x0b, // setup new content for the link

    SCTP_CMD_ITERATE_ELEMENTS:  0x0c, // return base template iteration result
    SCTP_CMD_ITERATE_CONSTRUCTION: 0x0d, // return advanced template iteration (batch of base templates)

    SCTP_CMD_EVENT_CREATE:      0x0e, // create subscription to specified event
    SCTP_CMD_EVENT_DESTROY:     0x0f, // destroys specified event subscription
    SCTP_CMD_EVENT_EMIT:        0x10, // emits events to client

    SCTP_CMD_FIND_ELEMENT_BY_SYSITDF:   0xa0, // return sc-element by it system identifier
    SCTP_CMD_SET_SYSIDTF:       0xa1, // setup new system identifier for sc-element
    SCTP_CMD_STATISTICS:        0xa2, // return usage statistics from server
};


var SctpResultCode = {
    SCTP_RESULT_OK:                 0x00,
    SCTP_RESULT_FAIL:               0x01,
    SCTP_RESULT_ERROR_NO_ELEMENT:   0x02 // sc-element wasn't founded
}


var SctpIteratorType = {
    SCTP_ITERATOR_3F_A_A:       0,
    SCTP_ITERATOR_3A_A_F:       1,
    SCTP_ITERATOR_3F_A_F:       2,
    SCTP_ITERATOR_5F_A_A_A_F:   3,
    SCTP_ITERATOR_5A_A_F_A_F:  4,
    SCTP_ITERATOR_5F_A_F_A_F:  5,
    SCTP_ITERATOR_5F_A_F_A_A:  6,
    SCTP_ITERATOR_5F_A_A_A_A:  7,
    SCTP_ITERATOR_5A_A_F_A_A:  8
}

var SctpEventType = {
    SC_EVENT_UNKNOWN:           -1,
    SC_EVENT_ADD_OUTPUT_ARC:     0,
    SC_EVENT_ADD_INPUT_ARC:      1,
    SC_EVENT_REMOVE_OUTPUT_ARC:  2,
    SC_EVENT_REMOVE_INPUT_ARC:   3,
    SC_EVENT_REMOVE_ELEMENT:     4,
    SC_EVENT_CONTENT_CHANGED:    5
}

module.exports = {
  SctpCommandType:              SctpCommandType,
  SctpResultCode:               SctpResultCode,
  SctpIteratorType:             SctpIteratorType,
  SctpEventType:                SctpEventType,

  sc_type_node:                 sc_type_node,
  sc_type_link:                 sc_type_link,
  sc_type_edge_common:          sc_type_edge_common,
  sc_type_arc_common:           sc_type_arc_common,
  sc_type_arc_access:           sc_type_arc_access,

  sc_type_const:                sc_type_const,
  sc_type_var:                  sc_type_var,

  sc_type_arc_pos:              sc_type_arc_pos,
  sc_type_arc_neg:              sc_type_arc_neg,
  sc_type_arc_fuz:              sc_type_arc_fuz,

  sc_type_arc_temp:             sc_type_arc_temp,
  sc_type_arc_perm:             sc_type_arc_perm,

  sc_type_node_tuple:           sc_type_node_tuple,
  sc_type_node_struct:          sc_type_node_struct,
  sc_type_node_role:            sc_type_node_role,
  sc_type_node_norole:          sc_type_node_norole,
  sc_type_node_class:           sc_type_node_class,
  sc_type_node_abstract:        sc_type_node_abstract,
  sc_type_node_material:        sc_type_node_material,

  sc_type_arc_pos_const_perm:   sc_type_arc_pos_const_perm,

  sc_type_element_mask:         sc_type_element_mask,
  sc_type_constancy_mask:       sc_type_constancy_mask,
  sc_type_positivity_mask:      sc_type_positivity_mask,
  sc_type_permanency_mask:      sc_type_permanency_mask,
  sc_type_node_struct_mask:     sc_type_node_struct_mask,
  sc_type_arc_mask:             sc_type_arc_mask
};
