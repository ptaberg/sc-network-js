const Q = require('q');
const util = require('util');
const ScHelper = require('./sc-helper');
const ScKeynodes = require('./sc-keynodes');
const ScType = require('./sc-types');
const StringView = require('./stringview');

const SctpResultCode = ScType.SctpResultCode;
const SctpIteratorType = ScType.SctpIteratorType;
const SctpEventType = ScType.SctpEventType;
const SctpCommandType = ScType.SctpCommandType;

function String2ArrayBuffer(string) {
    var string = unescape(encodeURIComponent(string)),
        charList = string.split(''),
        uintArray = [];
    for (var i = 0; i < charList.length; i++) {
        uintArray.push(charList[i].charCodeAt(0));
    }
    return new Uint8Array(uintArray);
}

function ArrayBuffer2String(arrayBuffer) {
    return new StringView(new Uint8Array(arrayBuffer)).toString();
}


var sc_addr_size = 4,
    sc_type_size = 2,
    sctp_header_size = 10;

sc_addr_from_id = function(sc_id) {
    var a = sc_id.split("_");
    var seg = parseInt(a[0]);
    var offset = parseInt(a[1]);

    return (offset << 16) | seg;
}

sc_addr_to_id = function(addr) {
    return (addr & 0xFFFF).toString() + '_' + ((addr >> 16) & 0xFFFF).toString();
}

sc_iterator_type_count = function(it) {
    if (it >= SctpIteratorType.SCTP_ITERATOR_3F_A_A && it <= SctpIteratorType.SCTP_ITERATOR_3F_A_F)
        return 3;

    if (it >= SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F && it <= SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_A)
        return 5;

    throw "Unknown iterator type";
}

sc_iterator_params_size = function(it) {
    switch (it) {
        case SctpIteratorType.SCTP_ITERATOR_3A_A_F:
        case SctpIteratorType.SCTP_ITERATOR_3F_A_A:
            return 8;
        case SctpIteratorType.SCTP_ITERATOR_3F_A_F:
            return 10;

        case SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_A:
        case SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_A:
            return 12;

        case SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_F:
        case SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F:
        case SctpIteratorType.SCTP_ITERATOR_5F_A_F_A_A:
            return 14;

        case SctpIteratorType.SCTP_ITERATOR_5F_A_F_A_F:
            return 16;
    };

    throw "Unknown iterator type";
}

sc_iteartor_fixed_count = function(it) {
    switch (it) {
        case SctpIteratorType.SCTP_ITERATOR_3A_A_F:
        case SctpIteratorType.SCTP_ITERATOR_3F_A_A:
        case SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_A:
        case SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_A:
            return 1;
        case SctpIteratorType.SCTP_ITERATOR_3F_A_F:
        case SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_F:
        case SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F:
        case SctpIteratorType.SCTP_ITERATOR_5F_A_F_A_A:
            return 2;

        case SctpIteratorType.SCTP_ITERATOR_5F_A_F_A_F:
            return 3;
    };

    throw "Unknown iterator type";
}

sc_iteartor_assign_count = function(it) {
    return sc_iterator_type_count(it) - sc_iteartor_fixed_count(it);
}

sc_iterator_is_fixed_arg = function(it, pos) {
    if (pos >= sc_iterator_type_count(it))
        throw "Inalid position for iterator";
    var res = false;
    switch (it) {
        case SctpIteratorType.SCTP_ITERATOR_3A_A_F:
        case SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_A:
            res = (pos == 2);
            break;
        case SctpIteratorType.SCTP_ITERATOR_3F_A_A:
        case SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_A:
            res = (pos == 0);
            break;
        case SctpIteratorType.SCTP_ITERATOR_3F_A_F:
        case SctpIteratorType.SCTP_ITERATOR_5F_A_F_A_A:
            res = (pos == 0 || pos == 2);
            break;

        case SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_F:
            res = (pos == 2 || pos == 4);
            break;
        case SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F:
            res = (pos == 0 || pos == 4);
            break;

        case SctpIteratorType.SCTP_ITERATOR_5F_A_F_A_F:
            res = (pos == 0 || pos == 2 || pos == 4);
            break;
    };

    return res;
}

function SctpCommandBuffer(size) {
    var b, pos = 0, s = size,
        view = new DataView(new ArrayBuffer(size + sctp_header_size));

    return b = {

        data: view.buffer,

        writeUint8: function(v) {
            view.setUint8(pos, parseInt(v), true);
            pos += 1;
        },

        writeUint16: function(v) {
            view.setUint16(pos, parseInt(v), true);
            pos += 2;
        },

        writeUint32: function(v) {
            view.setUint32(pos, parseInt(v), true);
            pos += 4;
        },

        writeBuffer: function(buff) {
            var dstU8 = new Uint8Array(view.buffer, pos);
            var srcU8 = new Uint8Array(buff);
            dstU8.set(srcU8);
            pos += buff.byteLength;
        },

        setHeader: function(cmd, flags, id) {
            this.writeUint8(cmd);
            this.writeUint8(flags);
            this.writeUint32(id);
            this.writeUint32(s);
        }
    };
};

function SctpResultBufferTypedArrayImpl(buffer) {
  var view = new DataView(buffer);

  return {
    getCmd: function() { return view.getUint8(0, true); },
    getId: function() { return view.getUint32(1, true); },
    getResultCode: function() { return view.getUint8(5, true); },
    getResultSize: function() { return view.getUint32(6, true); },
    getHeaderSize: function() { return sctp_header_size; },

    getResInt8: function(offset) { return view.getInt8(sctp_header_size + offset, true); },
    getResUint8: function(offset) { return view.getUint8(sctp_header_size + offset, true); },
    getResInt16: function(offset) { return view.getInt16(sctp_header_size + offset, true); },
    getResUint16: function(offset) { return view.getUint16(sctp_header_size + offset, true); },
    getResInt32: function(offset) { return view.getInt32(sctp_header_size + offset, true); },
    getResUint32: function(offset) { return view.getUint32(sctp_header_size + offset, true); },
    getResInt64: function(offset) { return this.getResInt32(offset) | (this.getResInt32(offset + 4) << 32); },
    getResUInt64: function(offset) { return this.getResUInt32(offset) | (this.getResUInt32(offset + 4) << 32); },
    getResFloat32: function(offset) { return view.getFloat32(sctp_header_size + offset, true); },
    getResFloat64: function(offset) { return view.getFloat64(sctp_header_size + offset, true); },
    getResBuffer: function(offset, len) { var o = sctp_header_size + offset; return view.buffer.slice(o); },
  };
}


function SctpResultBuffer(data) {

  // TODO: remove this function
  function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
  }

  if (util.isBuffer(data)) {
    return new SctpResultBufferTypedArrayImpl(toArrayBuffer(data));
  } else {
    return new SctpResultBufferTypedArrayImpl(data);
  }
}

SctpClientSocket = function(socket) {
  var socket_impl = socket;

  var _receive_sctp_message_impl = null;
  var _send_sctp_message_impl = null;

  var result = {
    _receive_sctp_message: null
  };


  if (socket_impl.onmessage && socket_impl.onclose && socket_impl.onerror) {
    console.log('SctpClient: use WebSocket');

    throw "WebSocket support still not implemented";
  } else {
    // most of all use node net module
    socket_impl.on('data', function(data) {
      result._receive_sctp_message(data);
    });
    result._send_sctp_message = function(data) {
      socket_impl.write(new Buffer(data));
    }
  }

  return result;
}

SctpClient = function(socket, events_update_period = 1000) {
    this.socket = new SctpClientSocket(socket);
    this.task_queue = [];
    this.task_timeout = 0;
    this.task_frequency = 10;
    this.events = {};

    // override function functions
    var self = this;
    function emit_events() {
        if (self.event_timeout != 0)
        {
            clearTimeout(self.event_timeout);
            self.event_timeout = 0;
        }

        self.event_emit();

        setTimeout(emit_events, events_update_period);
    };

    emit_events();
}

SctpClient.prototype._push_task = function(task) {
    this.task_queue.push(task);
    var self = this;

    function process() {
        var t = self.task_queue.shift();

        self.socket._receive_sctp_message = function(data) {

            var result = new SctpResultBuffer(data);
            if (result.getResultSize() != data.byteLength - result.getHeaderSize())
                throw "Invalid data size " + l

            var r = result;
            var resCode = result.getResultCode();
            if (data && resCode == SctpResultCode.SCTP_RESULT_OK) {
                if (t.parse)
                    r = t.parse(result);
                if (t.resCode)
                    resCode = t.resCode(result);
            }

            if (resCode == SctpResultCode.SCTP_RESULT_OK) {
                t.dfd.resolve(r);
            } else
                t.dfd.resolve();

            if (self.task_queue.length > 0)
            {
                self.task_timeout = setTimeout(process, self.task_frequency)
            }
            else
            {
                clearTimeout(self.task_timeout);
                self.task_timeout = 0;
            }
        }

        self.socket._send_sctp_message(t.message);
    }

    if (!this.task_timeout && this.task_queue.length > 0) {
        this.task_timeout = setTimeout(process, this.task_frequency)
    }
};

SctpClient.prototype.new_request = function(message, parseFn, resCodeFn) {
  var dfd = new Q.defer();

  this._push_task({
    message: message,
    parse: parseFn,
    resCode: resCodeFn,
    dfd: dfd
  });

  return dfd.promise;
};

SctpClient.prototype.erase_element = function(addr) {
    var buffer = new SctpCommandBuffer(sc_addr_size);
    buffer.setHeader(SctpCommandType.SCTP_CMD_ERASE_ELEMENT, 0, 0);
    buffer.writeUint32(addr);

    return this.new_request(buffer.data, function(data) {
      return true;
    });
};


SctpClient.prototype.check_element = function(addr) {
    var buffer = new SctpCommandBuffer(sc_addr_size);
    buffer.setHeader(SctpCommandType.SCTP_CMD_CHECK_ELEMENT, 0, 0);
    buffer.writeUint32(addr);

    return this.new_request(buffer.data, function(data) {
        return null;
    });
};

SctpClient.prototype.get_element_type = function(addr) {
    var buffer = new SctpCommandBuffer(sc_addr_size);
    buffer.setHeader(SctpCommandType.SCTP_CMD_GET_ELEMENT_TYPE, 0, 0);
    buffer.writeUint32(addr);

    return this.new_request(buffer.data, function(data) {
        return data.getResUint16(0);
    });
};

SctpClient.prototype.get_arc = function(addr) {
    var buffer = new SctpCommandBuffer(sc_addr_size);
    buffer.setHeader(SctpCommandType.SCTP_CMD_GET_ARC, 0, 0);
    buffer.writeUint32(addr);

    return this.new_request(buffer.data, function(data) {
        return [data.getResUint32(0), data.getResUint32(sc_addr_size)];
    });
};

SctpClient.prototype.create_node = function(type) {
    var buffer = new SctpCommandBuffer(sc_type_size);
    buffer.setHeader(SctpCommandType.SCTP_CMD_CREATE_NODE, 0, 0);
    buffer.writeUint16(type);

    return this.new_request(buffer.data, function(data) {
        return data.getResUint32(0);
    });
};


SctpClient.prototype.create_arc = function(type, src, trg) {
    var buffer = new SctpCommandBuffer(sc_type_size + 2 * sc_addr_size);
    buffer.setHeader(SctpCommandType.SCTP_CMD_CREATE_ARC, 0, 0);
    buffer.writeUint16(type);
    buffer.writeUint32(src);
    buffer.writeUint32(trg);

    return this.new_request(buffer.data, function(data) {
        return data.getResUint32(0);
    });
};


SctpClient.prototype.create_link = function() {
    var buffer = new SctpCommandBuffer(0);
    buffer.setHeader(SctpCommandType.SCTP_CMD_CREATE_LINK, 0, 0);

    return this.new_request(buffer.data, function(data) {
        return data.getResUint32(0);
    });
};


SctpClient.prototype.set_link_content = function(addr, data) {

    // determine type of content and it's size
    var dataBuff = null;
    if (typeof data === 'number') {
        size = 8;
        if (data % 1 === 0) {
            //! @todo: support of unsigned
            dataBuff = new ArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
            var view = new DataView(dataBuff);
            view.setInt32(0, data, true);
        } else {
            //! @todo: support unsigned
            dataBuff = new ArrayBuffer(Float64Array.BYTES_PER_ELEMENT);
            var view = new DataView(dataBuff);
            view.setFloat64(0, data, true);
        }
    } else if (typeof data === 'string' || data instanceof String) {
        dataBuff = String2ArrayBuffer(data);
    } else if (data instanceof ArrayBuffer) {
        dataBuff = data;
    } else
        throw "Unknown object type";

    var buffer = new SctpCommandBuffer(dataBuff.byteLength + sc_addr_size + Uint32Array.BYTES_PER_ELEMENT);
    buffer.setHeader(SctpCommandType.SCTP_CMD_SET_LINK_CONTENT, 0, 0);
    buffer.writeUint32(addr);
    buffer.writeUint32(dataBuff.byteLength);
    buffer.writeBuffer(dataBuff);

    return this.new_request(buffer.data, function(data) {
        return null;
    });
};


SctpClient.prototype.get_link_content = function(addr, type) {
    var buffer = new SctpCommandBuffer(sc_addr_size);
    buffer.setHeader(SctpCommandType.SCTP_CMD_GET_LINK_CONTENT, 0, 0);
    buffer.writeUint32(addr);

    return this.new_request(buffer.data, function(data) {
        var n = data.getResultSize();

        var r = null;
        if (!type || type === 'string') {
            r = ArrayBuffer2String(data.getResBuffer(0));
        } else if (type === 'binary') {
            r = data.getResBuffer(0);
        } else if (type === 'int64') {
            if (data.getResultSize() !== 8)
                throw "Invalid size of content " + data.getResultSize();
            r = data.getResInt64(0);
        } else if (type === 'int' || type === 'int32') {
            if (data.getResultSize() !== Int32Array.BYTES_PER_ELEMENT)
                throw "Invalid size of content " + data.getResultSize();
            r = data.getResInt32(0);
        } else if (type === 'float' || type === 'float32') {
            if (data.getResultSize() !== Float32Array.BYTES_PER_ELEMENT)
                throw "Invalid size of content " + data.getResultSize();
            r = data.getResFloat32(0);
        } else if (type === 'int8' || type === 'char') {
            if (data.getResultSize() !== Int8Array.BYTES_PER_ELEMENT)
                throw "Invalid size of content " + data.getResultSize();
            r = data.getResInt8(0);
        } else if (type === 'int16' || type === 'word') {
            if (data.getResultSize() !== Int16Array.BYTES_PER_ELEMENT)
                throw "Invalid size of content " + data.getResultSize();
            r = data.getResInt16(0);
        } else
            throw "Unknown type " + type;

        return r;
    });
};

SctpClient.prototype.find_links_with_content = function(data) {
    throw "Not implemented";
};

SctpClient.prototype.iterate_elements = function(iterator_type, args) {
    var itCount = sc_iterator_type_count(iterator_type);

    if (args.length != itCount)
        throw "Invalid number of arguments";

    var paramsSize = sc_iterator_params_size(iterator_type);
    var buffer = new SctpCommandBuffer(1 + paramsSize);
    buffer.setHeader(SctpCommandType.SCTP_CMD_ITERATE_ELEMENTS, 0, 0);
    buffer.writeUint8(iterator_type);

    switch (iterator_type)
    {
        case SctpIteratorType.SCTP_ITERATOR_3A_A_F:
            buffer.writeUint16(args[0]);
            buffer.writeUint16(args[1]);
            buffer.writeUint32(args[2]);
            break;
        case SctpIteratorType.SCTP_ITERATOR_3F_A_A:
            buffer.writeUint32(args[0]);
            buffer.writeUint16(args[1]);
            buffer.writeUint16(args[2]);
            break;
        case SctpIteratorType.SCTP_ITERATOR_3F_A_F:
            buffer.writeUint32(args[0]);
            buffer.writeUint16(args[1]);
            buffer.writeUint32(args[2]);
            break;
        case SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_A:
            buffer.writeUint16(args[0]);
            buffer.writeUint16(args[1]);
            buffer.writeUint32(args[2]);
            buffer.writeUint16(args[3]);
            buffer.writeUint16(args[4]);
            break;
        case SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_F:
            buffer.writeUint16(args[0]);
            buffer.writeUint16(args[1]);
            buffer.writeUint32(args[2]);
            buffer.writeUint16(args[3]);
            buffer.writeUint32(args[4]);
            break;
        case SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_A:
            buffer.writeUint32(args[0]);
            buffer.writeUint16(args[1]);
            buffer.writeUint16(args[2]);
            buffer.writeUint16(args[3]);
            buffer.writeUint16(args[4]);
            break;
        case SctpIteratorType.SCTP_ITERATOR_5F_A_F_A_A:
            buffer.writeUint32(args[0]);
            buffer.writeUint16(args[1]);
            buffer.writeUint32(args[2]);
            buffer.writeUint16(args[3]);
            buffer.writeUint16(args[4]);
            break;
        case SctpIteratorType.SCTP_ITERATOR_5F_A_F_A_F:
            buffer.writeUint32(args[0]);
            buffer.writeUint16(args[1]);
            buffer.writeUint32(args[2]);
            buffer.writeUint16(args[3]);
            buffer.writeUint32(args[4]);
            break;
        case SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F:
            buffer.writeUint32(args[0]);
            buffer.writeUint16(args[1]);
            buffer.writeUint16(args[2]);
            buffer.writeUint16(args[3]);
            buffer.writeUint32(args[4]);
            break;
    };

    return this.new_request(buffer.data, function(data) {
        var res = [];
        var n = data.getResUint32(0);
        for (var i = 0; i < n; ++i) {
            var idx = 4 + i * itCount * sc_addr_size;
            var r = [];
            for (var j = 0; j < itCount; ++j)
                r.push(data.getResUint32(idx + j * sc_addr_size));
            res.push(r);
        }

        return res;
    }, function(data) {
        return data.getResUint32(0) > 0 ? SctpResultCode.SCTP_RESULT_OK : SctpResultCode.SCTP_RESULT_FAIL;
    });
};

/* You can use that function to iterate advanced constructions
 * @param iterators Array of iterators description, that would be processed by order.
 * Each iterator description consist of iterator type, arguments and result mapping object
 * (use function SctpConstrIter to create it)
 * - iterator type - that just one of a value from SctpIteratorType
 * - arguments - array of arguments. Number of arguments depends on iterator_type (3 or 5).
 *   For assign argument of iterator (letter 'a' in iterator type name) you need to pass
 *   type of sc-element (combination of sc_type_... defines) or 0 (any type).
 *   For fixed arguments of iterator (letter 'f' in iterator type name) you need to pass one
 *   of two values:
 *   - sc-addr - sc-addr of specified sc-element
 *   - string - name of result from any previous iterator.
 * - mappings - object that maps iterator result to string name. Where keys - are assigned names to iterator results,
 *   and values - are iterator value index (in range [0; k), where k - number of arguments). All mapping
 *   names must to be unique (don't use equal name in different iterators)
 *
 * @returns If there are no any errors, then function returns promise object. Returned prmise object
 * rejcets on request fail. If request processed, then returned promise object resolves with,
 * object as argument. The last one has property results - plain array of results. Each item of that
 * array is an array of found sc-addrs (result of concatenation of all iterators results in the same order).
 * Also that object contains method get, that recieve index of result and the name as argument,
 * and returns sc-addr by name specified in result mappings for the result with specified index.
 */
SctpClient.prototype.iterate_constr = function() {

    var iterators = Array.prototype.slice.call(arguments, 0);
    var count = iterators.length;

    // calculate parameters size
    var paramsSize = 0;
    var oneResultSize = 0;
    var resMapping = {};
    for (var i = 0; i < count; ++i) {
        var it = iterators[i];
        var c = sc_iterator_type_count(it.iterator_type);

        if (c != it.args.length)
            throw "Invalid number of arguments";

        // prepare mappings
        if (it.mappings) {
            for (var k in it.mappings) {
                if (!it.mappings.hasOwnProperty(k))
                    continue;

                if (resMapping[k])
                    throw "Duplicate name in iterator results mapping";

                var m = it.mappings[k];
                if (m < 0 || m >= c)
                    throw "Invalid mapping index " + m;

                resMapping[k] = oneResultSize + m;
            }
        }

        it.repl = [];
        for (var j = 0; j < it.args.length; ++j) {
            var a = it.args[j];
            var isFixed = sc_iterator_is_fixed_arg(it.iterator_type, j);

            if ((a instanceof String) || (typeof a == "string")) {

                if (!isFixed)
                    throw "Invalid argument type, it must be an type";
                var idx = resMapping[a];
                if (idx == undefined || idx == null)
                    throw "Mapping name " + a + " doesn't exists";

                it.repl.push(idx);
            } else if (isFixed)
                it.repl.push(null);
        }

        if (sc_iteartor_fixed_count(it.iterator_type) != it.repl.length)
            throw "Invalid number of replaces";

        oneResultSize += c;
        if (i > 0)
            paramsSize += sc_iteartor_fixed_count(it.iterator_type);
        paramsSize += sc_iterator_params_size(it.iterator_type);
    }

    var buffer = new SctpCommandBuffer(count + 1 + paramsSize);
    buffer.setHeader(SctpCommandType.SCTP_CMD_ITERATE_CONSTRUCTION, 0, 0);
    buffer.writeUint8(count);
    for (var i = 0; i < count; ++i) {
        var it = iterators[i];

        buffer.writeUint8(it.iterator_type);
        if (i > 0)
        {
            for (var j = 0; j < it.repl.length; ++j) {
                var v = it.repl[j];
                buffer.writeUint8(v == null ? 255 : v);
            }
        }

        // wrtie params
        var rCount = 0;
        for (var j = 0; j < it.args.length; ++j) {
            if (sc_iterator_is_fixed_arg(it.iterator_type, j)) {
                if (it.repl[rCount] == null)
                    buffer.writeUint32(it.args[j]);
                rCount++;
            } else
                buffer.writeUint16(it.args[j]);
        }
    }

    return this.new_request(buffer.data, function(data) {

        var count = data.getResUint32(0);
        var res = [], r;

        if (data.getResultSize() != ((1 + oneResultSize * count) * Uint32Array.BYTES_PER_ELEMENT))
            throw "Invalid result size";

        for (var i = 0; i < count; ++i) {
            var item = [];
            for (var j = 0; j < oneResultSize; ++j) {
                item.push(data.getResUint32(Uint32Array.BYTES_PER_ELEMENT *(1 + i * oneResultSize + j)));
            }
            res.push(item);
        }

        return r = {
            results: res,

            exist: function() {
                return res.length > 0;
            },

            get: function(idx, name) {
                if (res[idx])
                    return res[idx][resMapping[name]];
                return null;
            }
        };
    });

};


SctpClient.prototype.find_element_by_system_identifier = function(data) {
    var buffData = String2ArrayBuffer(data);
    var buffer = new SctpCommandBuffer(buffData.byteLength + 4);
    buffer.setHeader(SctpCommandType.SCTP_CMD_FIND_ELEMENT_BY_SYSITDF, 0, 0);
    buffer.writeUint32(buffData.byteLength);
    buffer.writeBuffer(buffData);

    return this.new_request(buffer.data, function(data) {

        return data.getResUint32(0);
    });
};


SctpClient.prototype.set_system_identifier = function(addr, idtf) {
    throw "Not supported";
};

SctpClient.prototype.event_create = function(evt_type, addr, callback) {
    var dfd = new Q.defer();
    var self = this;

    var buffer = new SctpCommandBuffer(sc_addr_size + 1);
    buffer.setHeader(SctpCommandType.SCTP_CMD_EVENT_CREATE, 0, 0);
    buffer.writeUint8(evt_type);
    buffer.writeUint32(addr);

    this.new_request(buffer.data, function(data) {
        return data.getResUint32(0);
    }).then(function(data) {
        self.events[data] = callback;
        dfd.resolve(data);
    }, function(data) {
        dfd.reject(data);
    });

    return dfd.promise();
};

SctpClient.prototype.event_destroy = function(evt_id) {
    var dfd = new Q.defer();
    var self = this;

    var buffer = new SctpCommandBuffer(4);
    buffer.setHeader(SctpCommandType.SCTP_CMD_EVENT_DESTROY, 0, 0);
    buffer.writeUint32(evt_id);

    this.new_request(buffer.data, function(data) {
        return data.getResUint32(0);
    }).then(function(data) {
        delete self.event_emit[evt_id];
        dfd.promise(data);
    }, function(data) {
        dfd.reject(data);
    });

    return dfd.promise();
};

SctpClient.prototype.event_emit = function() {
    var self = this;

    var buffer = new SctpCommandBuffer(0);
    buffer.setHeader(SctpCommandType.SCTP_CMD_EVENT_EMIT, 0, 0);

    return this.new_request(buffer.data, function (data) {
        var n = data.getResUint32(0);

        for (var i = 0; i < n; ++i) {
            evt_id = data.getResUint32(4 + i * 12);
            addr = data.getResUint32(8 + i * 12);
            arg = data.getResUint32(12 + i * 12);
            var func = self.events[evt_id];

            if (func)
                func(addr, arg);
        }
    });
};

SctpClient.prototype.get_statistics = function() {
    throw "Not implemented";
};

module.exports = {
  SctpClient:                   SctpClient,
  Helper:                       ScHelper,
  Keynodes:                     ScKeynodes,
  Types:                        ScType
};
