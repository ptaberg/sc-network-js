import * as sc from '@ostis/sc-core';

import { TextDecoder, TextEncoder } from 'text-encoding';
import * as Q from 'q';

import { SctpCommandType,
         SctpEventType,
         SctpIteratorType,
         SctpResultCode,
         ScType, ScAddr} from './sc-types';


function String2ArrayBuffer(str: string) : Uint8Array {
    return new TextEncoder('utf-8').encode(str);
}

function ArrayBuffer2String(buff: ArrayBuffer) {
    const view: ArrayBufferView = {
        buffer: buff,
        byteLength: buff.byteLength,
        byteOffset: 0
    };
    return new TextDecoder('utf-8').decode(view);
}

// --------------------------------------------------
class SctpCommandBuffer {
    private pos: number = 0;
    private size: number = 0;
    private view: DataView = null;

    constructor(size: number) {
        this.size = size;
        this.view = new DataView(new ArrayBuffer(this.size + ScNet.sctp_header_size));
    }

    public get data() : ArrayBuffer {
        return this.view.buffer;
    }

    public writeUint8(v: number) {
        this.view.setUint8(this.pos, v);
        this.pos += 1;
    }

    public writeUint16(v: number) {
        this.view.setUint16(this.pos, v, true);
        this.pos += 2;
    }

    public writeUint32(v: number) {
        this.view.setUint32(this.pos, v, true);
        this.pos += 4;
    }

    public writeBuffer(buff: ArrayBuffer) {
        var dstU8 = new Uint8Array(this.view.buffer, this.pos);
        var srcU8 = new Uint8Array(buff);
        dstU8.set(srcU8);
        this.pos += buff.byteLength;
    }

    public setHeader(cmd: SctpCommandType, flags: number, id: number) {
        this.writeUint8(cmd);
        this.writeUint8(flags);
        this.writeUint32(id);
        this.writeUint32(this.size);
    }
};

class SctpResultBufferTypedArray{
    private view: DataView = null;
    
    constructor(buffer: ArrayBuffer) {
        this.view = new DataView(buffer);
    }
    
    public getCmd() : SctpCommandType {
        return this.view.getUint8(0);
    }

    public getId() : number {
        return this.view.getUint32(1, true);
    }

    public getResultCode() : SctpResultCode {
        return this.view.getUint8(5);
    }

    public getResultSize() : number {
        return this.view.getUint32(6, true);
    }
    
    public getHeaderSize() : number {
        return ScNet.sctp_header_size;
    }

    public getResInt8(offset: number) : number {
        return this.view.getInt8(ScNet.sctp_header_size + offset);
    }

    public getResUint8(offset: number) : number {
        return this.view.getUint8(ScNet.sctp_header_size + offset);
    }

    public getResInt16(offset: number) : number {
        return this.view.getInt16(ScNet.sctp_header_size + offset, true);
    }

    public getResUint16(offset: number) : number {
        return this.view.getUint16(ScNet.sctp_header_size + offset, true);
    }

    public getResInt32(offset: number) : number {
        return this.view.getInt32(ScNet.sctp_header_size + offset, true);
    }

    public getResUInt32(offset: number) : number {
        return this.view.getUint32(ScNet.sctp_header_size + offset, true);
    }

    public getResInt64(offset: number) : number {
        return this.getResInt32(offset) | (this.getResInt32(offset + 4) << 32);
    }

    public getResUInt64(offset: number) : number {
        return this.getResUInt32(offset) | (this.getResUInt32(offset + 4) << 32);
    }

    public getResFloat32(offset: number) : number {
        return this.view.getFloat32(ScNet.sctp_header_size + offset, true);
    }

    public getResFloat64(offset: number) : number {
        return this.view.getFloat64(ScNet.sctp_header_size + offset, true);
    }

    public getResBuffer(offset: number) : ArrayBuffer {
        const o = ScNet.sctp_header_size + offset;
        return this.view.buffer.slice(o);
    }
};

class ScNet {
    public static get sc_addr_size(): number { return 4; }
    public static get sc_type_size(): number { return 2; }
    public static get sctp_header_size(): number { return 10; }

    public static scAddrFromStr(id: string) : ScAddr {
        return parseInt(id);
    }

    public static scAddrToStr(addr: ScAddr) : string {
        return addr.toString();
    }

    public static scIteratorTypeCount(it: SctpIteratorType) : number {
        if (it >= SctpIteratorType._3F_A_A && it <= SctpIteratorType._3F_A_F)
            return 3;

        if (it >= SctpIteratorType._5F_A_A_A_F && it <= SctpIteratorType._5A_A_F_A_A)
            return 5;

        throw "Unknown iterator type";
    }

    public static scIteratorParamsSize(it: SctpIteratorType) : number {
        switch (it) {
            case SctpIteratorType._3A_A_F:
            case SctpIteratorType._3F_A_A:
                return 8;
            case SctpIteratorType._3F_A_F:
                return 10;

            case SctpIteratorType._5A_A_F_A_A:
            case SctpIteratorType._5F_A_A_A_A:
                return 12;

            case SctpIteratorType._5A_A_F_A_F:
            case SctpIteratorType._5F_A_A_A_F:
            case SctpIteratorType._5F_A_F_A_A:
                return 14;

            case SctpIteratorType._5F_A_F_A_F:
                return 16;
        };

        throw "Unknown iterator type";
    }

    public static scIteartorFixedCount(it: SctpIteratorType) : number {
        switch (it) {
            case SctpIteratorType._3A_A_F:
            case SctpIteratorType._3F_A_A:
            case SctpIteratorType._5F_A_A_A_A:
            case SctpIteratorType._5A_A_F_A_A:
                return 1;
            case SctpIteratorType._3F_A_F:
            case SctpIteratorType._5A_A_F_A_F:
            case SctpIteratorType._5F_A_A_A_F:
            case SctpIteratorType._5F_A_F_A_A:
                return 2;

            case SctpIteratorType._5F_A_F_A_F:
                return 3;
        };

        throw "Unknown iterator type";
    }

    public static scIteartorAssignCount(it: SctpIteratorType) : number {
        return ScNet.scIteratorTypeCount(it) - ScNet.scIteartorFixedCount(it);
    }

    public static scIteratorIsFixedArg(it: SctpIteratorType, pos: number) : boolean {
        if (pos >= ScNet.scIteratorTypeCount(it))
            throw "Inalid position for iterator";
        
        let res = false;
        switch (it) {
            case SctpIteratorType._3A_A_F:
            case SctpIteratorType._5A_A_F_A_A:
                res = (pos == 2);
                break;
            case SctpIteratorType._3F_A_A:
            case SctpIteratorType._5F_A_A_A_A:
                res = (pos == 0);
                break;
            case SctpIteratorType._3F_A_F:
            case SctpIteratorType._5F_A_F_A_A:
                res = (pos == 0 || pos == 2);
                break;

            case SctpIteratorType._5A_A_F_A_F:
                res = (pos == 2 || pos == 4);
                break;
            case SctpIteratorType._5F_A_A_A_F:
                res = (pos == 0 || pos == 4);
                break;

            case SctpIteratorType._5F_A_F_A_F:
                res = (pos == 0 || pos == 2 || pos == 4);
                break;
        };

        return res;
    }

    // ----------------
};

function SctpResultBuffer(data: any) {
    return new SctpResultBufferTypedArray(data);
}

class SctpClientSocket {
    private socket: WebSocket = null;

    constructor(socket: WebSocket) {
        this.socket = socket;
        this.socket.onclose = this.OnClose.bind(this);
        this.socket.onerror = this.OnError.bind(this);
        this.socket.onopen = this.OnOpen.bind(this);
    }

    public SetOnMessage(func: any) {
        this.socket.onmessage = func;
    }

    public Send(data: ArrayBuffer) {
        this.socket.send(data);
    }

    private OnClose() {

    }

    private OnError() {

    }

    private OnOpen() {

    }

};


type EventCallbackFunction = (addr: ScAddr, arg: ScAddr) => void;
type ParseCallbackFunction = (data: SctpResultBufferTypedArray) => any;
type Deferred = Q.Deferred<any>;

interface ITask {
    message: ArrayBuffer;
    parse: ParseCallbackFunction;
    resCode: ParseCallbackFunction;
    dfd: Deferred;
};

interface IIteratorConstr {
    type: SctpIteratorType;
    args: any[];
    mappings: {};
    repl: any[];
};

export class SctpClient {
    private socket: SctpClientSocket = null;
    private eventsUpdatePeriod: number = 1000;
    private taskQueue: ITask[] = [];
    private taskTimeout: any = 0;
    private taskFrequency: number = 10;
    private events: {[id: number] : EventCallbackFunction; } = {};

    constructor(wsURL: string, eventsUpdatePeriodMS: number) {
        this.eventsUpdatePeriod = eventsUpdatePeriodMS;

        this.socket = new SctpClientSocket(new WebSocket(wsURL));

        const self = this;
        let eventTimeout = 0;
        function emitEvents() {
            if (eventTimeout != 0)
            {
                clearTimeout(eventTimeout);
                eventTimeout = 0;
            }

            self.EventEmit();

            setTimeout(emitEvents, self.eventsUpdatePeriod);
        }

        emitEvents();
    }

    private PushTask(task: ITask) {
        this.taskQueue.push(task);

        const self = this;

        function process() {
            const t = self.taskQueue.shift();
            let completeData = new Uint8Array(0);

            function _appendBuffer(buffer1, buffer2) {
                if (!buffer1) {
                return buffer2;
                }

                const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
                tmp.set(new Uint8Array(buffer1), 0);
                tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
                return tmp;
            };

            self.socket.SetOnMessage(function(data) {
                completeData = _appendBuffer(completeData, data);

                let result = SctpResultBuffer(completeData.buffer);
                const responseLength = result.getResultSize() + result.getHeaderSize();
                if (responseLength <= completeData.byteLength) {
                    var subdata = completeData.subarray(0, responseLength);

                    result = SctpResultBuffer(subdata.buffer);
                    completeData = completeData.slice(responseLength);

                    let r = result;
                    let resCode = result.getResultCode();
                    if (data && resCode == SctpResultCode.RESULT_OK) {
                        if (t.parse)
                            r = t.parse(result);
                        if (t.resCode)
                            resCode = t.resCode(result);
                    }

                    if (resCode == SctpResultCode.RESULT_OK) {
                        t.dfd.resolve(r);
                    } else {
                        t.dfd.resolve();
                    }

                    if (self.taskQueue.length > 0)
                    {
                        self.taskTimeout = setTimeout(process, self.taskFrequency);
                    }
                    else
                    {
                        clearTimeout(self.taskTimeout);
                        self.taskTimeout = 0;
                    }
                }
            });

            self.socket.Send(t.message);
        }

        if (!this.taskTimeout && this.taskQueue.length > 0) {
            this.taskTimeout = setTimeout(process, this.taskFrequency);
        }
    }

    private NewRequest(message: ArrayBuffer, parseFn: ParseCallbackFunction, resCodeFn: ParseCallbackFunction) {
        const dfd = Q.defer<any>();

        this.PushTask({
            message: message,
            parse: parseFn,
            resCode: resCodeFn,
            dfd: dfd
        });

        return dfd.promise;
    }

    public EraseElement(addr: ScAddr) {
        const buffer = new SctpCommandBuffer(ScNet.sc_addr_size);
        buffer.setHeader(SctpCommandType.ERASE_ELEMENT, 0, 0);
        buffer.writeUint32(addr);

        return this.NewRequest(buffer.data, function(data) {
            return true;
        }, null);
    }
    public CheckElement(addr: ScAddr) {
        const buffer = new SctpCommandBuffer(ScNet.sc_addr_size);
        buffer.setHeader(SctpCommandType.CHECK_ELEMENT, 0, 0);
        buffer.writeUint32(addr);

        return this.NewRequest(buffer.data, function(data) {
            return null;
        }, null);
    }

    public GetElementType(addr: ScAddr) {
        const buffer = new SctpCommandBuffer(ScNet.sc_addr_size);
        buffer.setHeader(SctpCommandType.GET_ELEMENT_TYPE, 0, 0);
        buffer.writeUint32(addr);

        return this.NewRequest(buffer.data, function(data) {
            return data.getResUint16(0);
        }, null);
    }

    public GetEdge(addr: ScAddr) {
        const buffer = new SctpCommandBuffer(ScNet.sc_addr_size);
        buffer.setHeader(SctpCommandType.GET_EDGE, 0, 0);
        buffer.writeUint32(addr);

        return this.NewRequest(buffer.data, function(data) {
            return [data.getResUInt32(0), data.getResUInt32(ScNet.sc_addr_size)];
        }, null);
    }

    public CreateNode(type: ScType) {
        const buffer = new SctpCommandBuffer(ScNet.sc_type_size);
        buffer.setHeader(SctpCommandType.CREATE_NODE, 0, 0);
        buffer.writeUint16(type.value);

        return this.NewRequest(buffer.data, function(data) {
            return data.getResUInt32(0);
        }, null);
    }

    public CreateEdge(type: ScType, src: ScAddr, trg: ScAddr) {
        const buffer = new SctpCommandBuffer(ScNet.sc_type_size + 2 * ScNet.sc_addr_size);
        buffer.setHeader(SctpCommandType.CREATE_EDGE, 0, 0);
        buffer.writeUint16(type.value);
        buffer.writeUint32(src);
        buffer.writeUint32(trg);

        return this.NewRequest(buffer.data, function(data) {
            return data.getResUInt32(0);
        }, null);
    }

    public CreateLink() {
        const buffer = new SctpCommandBuffer(0);
        buffer.setHeader(SctpCommandType.CREATE_LINK, 0, 0);

        return this.NewRequest(buffer.data, function(data) {
            return data.getResUInt32(0);
        }, null);
    }

    public SetLinkContent(addr: ScAddr, data: any) {
        // determine type of content and it's size
        let dataBuff = null;
        if (typeof data === 'number') {
            const size = 8;
            if (data % 1 === 0) {
                //! @todo: support of unsigned
                dataBuff = new ArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
                const view = new DataView(dataBuff);
                view.setInt32(0, data, true);
            } else {
                //! @todo: support unsigned
                dataBuff = new ArrayBuffer(Float64Array.BYTES_PER_ELEMENT);
                const view = new DataView(dataBuff);
                view.setFloat64(0, data, true);
            }
        } else if (typeof data === 'string' || data instanceof String) {
            dataBuff = String2ArrayBuffer(data.toString());
        } else if (data instanceof ArrayBuffer) {
            dataBuff = data;
        } else
            throw "Unknown object type";

        const buffer = new SctpCommandBuffer(dataBuff.byteLength + ScNet.sc_addr_size + Uint32Array.BYTES_PER_ELEMENT);
        buffer.setHeader(SctpCommandType.SET_LINK_CONTENT, 0, 0);
        buffer.writeUint32(addr);
        buffer.writeUint32(dataBuff.byteLength);
        buffer.writeBuffer(dataBuff);

        return this.NewRequest(buffer.data, function(data) {
            return null;
        }, null);
    }

    public GetLinkContent(addr: ScAddr, type: string) {
        const buffer = new SctpCommandBuffer(ScNet.sc_addr_size);
        buffer.setHeader(SctpCommandType.GET_LINK_CONTENT, 0, 0);
        buffer.writeUint32(addr);

        return this.NewRequest(buffer.data, function(data) {
            const n = data.getResultSize();

            let r = null;
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
        }, null);
    }

    public Iterate(iterType: SctpIteratorType, args: any[]) {
        const itCount = ScNet.scIteratorTypeCount(iterType);

        if (args.length != itCount)
            throw "Invalid number of arguments";

        const paramsSize = ScNet.scIteratorParamsSize(iterType);
        const buffer = new SctpCommandBuffer(1 + paramsSize);
        buffer.setHeader(SctpCommandType.ITERATE_ELEMENTS, 0, 0);
        buffer.writeUint8(iterType);

        switch (iterType)
        {
            case SctpIteratorType._3A_A_F:
                buffer.writeUint16(args[0]);
                buffer.writeUint16(args[1]);
                buffer.writeUint32(args[2]);
                break;
            case SctpIteratorType._3F_A_A:
                buffer.writeUint32(args[0]);
                buffer.writeUint16(args[1]);
                buffer.writeUint16(args[2]);
                break;
            case SctpIteratorType._3F_A_F:
                buffer.writeUint32(args[0]);
                buffer.writeUint16(args[1]);
                buffer.writeUint32(args[2]);
                break;
            case SctpIteratorType._5A_A_F_A_A:
                buffer.writeUint16(args[0]);
                buffer.writeUint16(args[1]);
                buffer.writeUint32(args[2]);
                buffer.writeUint16(args[3]);
                buffer.writeUint16(args[4]);
                break;
            case SctpIteratorType._5A_A_F_A_F:
                buffer.writeUint16(args[0]);
                buffer.writeUint16(args[1]);
                buffer.writeUint32(args[2]);
                buffer.writeUint16(args[3]);
                buffer.writeUint32(args[4]);
                break;
            case SctpIteratorType._5F_A_A_A_A:
                buffer.writeUint32(args[0]);
                buffer.writeUint16(args[1]);
                buffer.writeUint16(args[2]);
                buffer.writeUint16(args[3]);
                buffer.writeUint16(args[4]);
                break;
            case SctpIteratorType._5F_A_F_A_A:
                buffer.writeUint32(args[0]);
                buffer.writeUint16(args[1]);
                buffer.writeUint32(args[2]);
                buffer.writeUint16(args[3]);
                buffer.writeUint16(args[4]);
                break;
            case SctpIteratorType._5F_A_F_A_F:
                buffer.writeUint32(args[0]);
                buffer.writeUint16(args[1]);
                buffer.writeUint32(args[2]);
                buffer.writeUint16(args[3]);
                buffer.writeUint32(args[4]);
                break;
            case SctpIteratorType._5F_A_A_A_F:
                buffer.writeUint32(args[0]);
                buffer.writeUint16(args[1]);
                buffer.writeUint16(args[2]);
                buffer.writeUint16(args[3]);
                buffer.writeUint32(args[4]);
                break;
        };

        return this.NewRequest(buffer.data, function(data) {
            const res = [];
            const n = data.getResUInt32(0);
            for (let i = 0; i < n; ++i) {
                const idx = 4 + i * itCount * ScNet.sc_addr_size;
                const r = [];
                for (let j = 0; j < itCount; ++j)
                    r.push(data.getResUInt32(idx + j * ScNet.sc_addr_size));
                res.push(r);
            }

            return res;
        }, function(data) {
            return data.getResUInt32(0) > 0 ? SctpResultCode.RESULT_OK : SctpResultCode.RESULT_FAIL;
        });
    }

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
    public IterateConstr(iters: IIteratorConstr[]) {
        const count = iters.length;

        // calculate parameters size
        let paramsSize = 0;
        let oneResultSize = 0;
        let resMapping = {};
        for (let i = 0; i < count; ++i) {
            const it = iters[i];
            const c = ScNet.scIteratorTypeCount(it.type);

            if (c != it.args.length)
                throw "Invalid number of arguments";

            // prepare mappings
            if (it.mappings) {
                for (let k in it.mappings) {
                    if (!it.mappings.hasOwnProperty(k))
                        continue;

                    if (resMapping[k])
                        throw "Duplicate name in iterator results mapping";

                    const m = it.mappings[k];
                    if (m < 0 || m >= c)
                        throw "Invalid mapping index " + m;

                    resMapping[k] = oneResultSize + m;
                }
            }

            it.repl = [];
            for (let j = 0; j < it.args.length; ++j) {
                const a = it.args[j];
                const isFixed = ScNet.scIteratorIsFixedArg(it.type, j);

                if ((a instanceof String) || (typeof a == "string")) {

                    if (!isFixed)
                        throw "Invalid argument type, it must be an type";
                    const idx = resMapping[a.toString()];
                    if (idx == undefined || idx == null)
                        throw "Mapping name " + a + " doesn't exists";

                    it.repl.push(idx);
                } else if (isFixed)
                    it.repl.push(null);
            }

            if (ScNet.scIteartorFixedCount(it.type) != it.repl.length)
                throw "Invalid number of replaces";

            oneResultSize += c;
            if (i > 0)
                paramsSize += ScNet.scIteartorFixedCount(it.type);
            paramsSize += ScNet.scIteratorParamsSize(it.type);
        }

        const buffer = new SctpCommandBuffer(count + 1 + paramsSize);
        buffer.setHeader(SctpCommandType.ITERATE_CONSTRUCTION, 0, 0);
        buffer.writeUint8(count);
        for (let i = 0; i < count; ++i) {
            const it: IIteratorConstr = iters[i];

            buffer.writeUint8(it.type);
            if (i > 0)
            {
                for (let j = 0; j < it.repl.length; ++j) {
                    const v = it.repl[j];
                    buffer.writeUint8(v == null ? 255 : v);
                }
            }

            // wrtie params
            let rCount = 0;
            for (let j = 0; j < it.args.length; ++j) {
                if (ScNet.scIteratorIsFixedArg(it.type, j)) {
                    if (it.repl[rCount] == null)
                        buffer.writeUint32(it.args[j]);
                    rCount++;
                } else
                    buffer.writeUint16(it.args[j]);
            }
        }

        return this.NewRequest(buffer.data, function(data) {

            const count = data.getResUInt32(0);
            let res = [], r;

            if (data.getResultSize() != ((1 + oneResultSize * count) * Uint32Array.BYTES_PER_ELEMENT))
                throw "Invalid result size";

            for (let i = 0; i < count; ++i) {
                const item = [];
                for (let j = 0; j < oneResultSize; ++j) {
                    item.push(data.getResUInt32(Uint32Array.BYTES_PER_ELEMENT *(1 + i * oneResultSize + j)));
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
        }, null);
    }

    public FindElementBySysIdtf(idtf: string) {
        const buffData = String2ArrayBuffer(idtf);
        const buffer = new SctpCommandBuffer(buffData.byteLength + 4);
        buffer.setHeader(SctpCommandType.FIND_ELEMENT_BY_SYSITDF, 0, 0);
        buffer.writeUint32(buffData.byteLength);
        buffer.writeBuffer(buffData.buffer);

        return this.NewRequest(buffer.data, function(data) {
            return data.getResUInt32(0);
        }, null);
    }

    public EventCreate(evtType: SctpEventType, addr: ScAddr, callback: EventCallbackFunction) {
        const dfd = Q.defer<any>();
        const self = this;

        const buffer = new SctpCommandBuffer(ScNet.sc_addr_size + 1);
        buffer.setHeader(SctpCommandType.EVENT_CREATE, 0, 0);
        buffer.writeUint8(evtType);
        buffer.writeUint32(addr);

        this.NewRequest(buffer.data, function(data) {
            return data.getResUInt32(0);
        }, null).then(function(data) {
            self.events[data] = callback;
            dfd.resolve(data);
        }, function(data) {
            dfd.reject(data);
        });

        return dfd.promise;
    }

    public EventDestroy(evtID: number) {
        const dfd = Q.defer<any>();
        const self = this;

        const buffer = new SctpCommandBuffer(4);
        buffer.setHeader(SctpCommandType.EVENT_DESTROY, 0, 0);
        buffer.writeUint32(evtID);

        this.NewRequest(buffer.data, function(data) {
            return data.getResUInt32(0);
        }, null).then(function(data) {
            delete self.events[evtID];
            dfd.resolve(true);
        }, function(data) {
            dfd.reject(false);
        });

        return dfd.promise;
    }

    public EventEmit() {
        const self = this;

        const buffer = new SctpCommandBuffer(0);
        buffer.setHeader(SctpCommandType.EVENT_EMIT, 0, 0);

        return this.NewRequest(buffer.data, function (data) {
            const n = data.getResUInt32(0);

            for (let i = 0; i < n; ++i) {
                const evtID = data.getResUInt32(4 + i * 12);
                const addr = data.getResUInt32(8 + i * 12);
                const arg = data.getResUInt32(12 + i * 12);
                const func = self.events[evtID];

                if (func)
                    func(addr, arg);
            }
        }, null);
    }
};
