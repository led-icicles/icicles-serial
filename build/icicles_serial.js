"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IciclesPort = void 0;
const serialport_1 = __importDefault(require("serialport"));
const utils_1 = require("./utils");
const serial_message_types_1 = require("./serial_message_types");
class IciclesPort {
    constructor(portName, { onData, baudRate = IciclesPort.defaultBaudRate, } = {}) {
        this.portName = portName;
        this._messagesToSend = 0;
        this._pingEvery = 10000;
        this.onData = onData;
        // @ts-ignore
        this.parser = new serialport_1.default.parsers.Readline({
            encoding: "binary",
        });
        this.parser.on("data", this._onData);
        this.port = new serialport_1.default(portName, {
            baudRate: baudRate !== null && baudRate !== void 0 ? baudRate : IciclesPort.defaultBaudRate,
        });
    }
    _onData(chunk) {
        var _a;
        (_a = this.onData) === null || _a === void 0 ? void 0 : _a.call(this, chunk);
    }
    getPingMessage() {
        const bytes = new Uint8Array(utils_1.UINT_8_SIZE_IN_BYTES);
        bytes[0] = serial_message_types_1.SerialMessageTypes.ping;
        return bytes;
    }
    get isSending() {
        return this._messagesToSend !== 0;
    }
    send(bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            this._messagesToSend++;
            // skip pings for [this._pingEvery] duration
            this._reschedulePings(this._pingEvery);
            const buffer = Buffer.from(bytes.buffer);
            yield new Promise((res, rej) => {
                this.port.write(buffer, (err, bytesWritten) => {
                    this._messagesToSend--;
                    if (err) {
                        rej(err);
                    }
                    else {
                        res(bytesWritten);
                    }
                });
            });
        });
    }
    get pingsEnabled() {
        return this._pingInterval !== undefined || this._pingTimeout !== undefined;
    }
    /**
     * This method is also used internally to skip ping requests when there is no needed for them.
     */
    start({ pingEvery = 10000, } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof pingEvery === "number") {
                this._pingEvery = pingEvery;
            }
            this._reschedulePings(this._pingEvery);
            this.sendPing();
        });
    }
    _reschedulePings(pingEvery) {
        this._clearPings();
        this._pingInterval = setInterval(() => this._schedulePing(pingEvery), pingEvery);
    }
    _clearPings() {
        this._clearPingTimer();
        this._clearScheduledPing();
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this._clearPings();
            yield this.sendEnd();
        });
    }
    sendPing() {
        return __awaiter(this, void 0, void 0, function* () {
            const messageTypeSize = utils_1.UINT_8_SIZE_IN_BYTES;
            const bytes = new Uint8Array(messageTypeSize);
            bytes[0] = serial_message_types_1.SerialMessageTypes.ping;
            yield this.send(bytes);
        });
    }
    sendEnd() {
        return __awaiter(this, void 0, void 0, function* () {
            const messageTypeSize = utils_1.UINT_8_SIZE_IN_BYTES;
            const bytes = new Uint8Array(messageTypeSize);
            bytes[0] = serial_message_types_1.SerialMessageTypes.end;
            yield this.send(bytes);
        });
    }
    /**
     * Clears ping if ping is scheduled
     */
    _clearScheduledPing() {
        if (this._pingTimeout !== undefined) {
            clearTimeout(this._pingTimeout);
            this._pingTimeout = undefined;
        }
    }
    /**
     * Clear current scheduled ping request and schedule new one.
     */
    _schedulePing(delay = 10000) {
        this._pingTimeout = setTimeout(this.sendPing, delay);
    }
    _clearPingTimer() {
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
            this._pingInterval = undefined;
        }
    }
    display(view) {
        return __awaiter(this, void 0, void 0, function* () {
            const bytes = view.toBytes();
            yield this.send(bytes);
        });
    }
}
exports.IciclesPort = IciclesPort;
IciclesPort.defaultBaudRate = 921600;
