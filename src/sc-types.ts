import * as sc from '@ostis/sc-core';

export { ScType, ScAddr } from '@ostis/sc-core';

export enum SctpCommandType {
    UNKNOWN           = 0x00, // unkown command
    CHECK_ELEMENT     = 0x01, // check if specified sc-element exist
    GET_ELEMENT_TYPE  = 0x02, // return sc-element type
    ERASE_ELEMENT     = 0x03, // erase specified sc-element
    CREATE_NODE       = 0x04, // create new sc-node
    CREATE_LINK       = 0x05, // create new sc-link
    CREATE_EDGE       = 0x06, // create new sc-edge
    GET_EDGE          = 0x07, // return begin element of sc-edge

    GET_LINK_CONTENT  = 0x09, // return content of sc-link
    FIND_LINKS        = 0x0a, // return sc-links with specified content
    SET_LINK_CONTENT  = 0x0b, // setup new content for the link

    ITERATE_ELEMENTS  = 0x0c, // return base template iteration result
    ITERATE_CONSTRUCTION = 0x0d, // return advanced template iteration (batch of base templates)

    EVENT_CREATE      = 0x0e, // create subscription to specified event
    EVENT_DESTROY     = 0x0f, // destroys specified event subscription
    EVENT_EMIT        = 0x10, // emits events to client

    FIND_ELEMENT_BY_SYSITDF = 0xa0, // return sc-element by it system identifier
    SET_SYSIDTF       = 0xa1, // setup new system identifier for sc-element
    STATISTICS        = 0xa2, // return usage statistics from server
};


export enum SctpResultCode {
    RESULT_OK                 = 0x00,
    RESULT_FAIL               = 0x01,
    RESULT_ERROR_NO_ELEMENT   = 0x02, // sc-element wasn't founded
}


export enum SctpIteratorType {
    _3F_A_A       = 0,
    _3A_A_F       = 1,
    _3F_A_F       = 2,
    _5F_A_A_A_F   = 3,
    _5A_A_F_A_F   = 4,
    _5F_A_F_A_F   = 5,
    _5F_A_F_A_A   = 6,
    _5F_A_A_A_A   = 7,
    _5A_A_F_A_A   = 8
}

export enum SctpEventType {
    UNKNOWN            = -1,
    ADD_OUTPUT_EDGE    = 0,
    ADD_INPUT_EDGE     = 1,
    REMOVE_OUTPUT_EDGE = 2,
    REMOVE_INPUT_EDGE  = 3,
    REMOVE_ELEMENT     = 4,
    CONTENT_CHANGED    = 5
}
