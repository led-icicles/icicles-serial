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
        this._onData = (chunk) => {
            var _a;
            (_a = this.onData) === null || _a === void 0 ? void 0 : _a.call(this, chunk);
        };
        this._messagesToSend = 0;
        this.send = (bytes) => __awaiter(this, void 0, void 0, function* () {
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
        this._pingEvery = 10000;
        /**
         * This method is also used internally to skip ping requests when there is no needed for them.
         */
        this.start = ({ pingEvery = 10000, } = {}) => __awaiter(this, void 0, void 0, function* () {
            if (typeof pingEvery === "number") {
                this._pingEvery = pingEvery;
            }
            this._reschedulePings(this._pingEvery);
            this.sendPing();
        });
        this._reschedulePings = (pingEvery) => {
            this._clearPings();
            this._pingInterval = setInterval(() => this._schedulePing(pingEvery), pingEvery);
        };
        this._clearPings = () => {
            this._clearPingTimer();
            this._clearScheduledPing();
        };
        this.stop = () => __awaiter(this, void 0, void 0, function* () {
            this._clearPings();
            yield this.sendEnd();
        });
        this.sendPing = () => __awaiter(this, void 0, void 0, function* () {
            const messageTypeSize = utils_1.UINT_8_SIZE_IN_BYTES;
            const bytes = new Uint8Array(messageTypeSize);
            bytes[0] = serial_message_types_1.SerialMessageTypes.ping;
            yield this.send(bytes);
        });
        this.sendEnd = () => __awaiter(this, void 0, void 0, function* () {
            const messageTypeSize = utils_1.UINT_8_SIZE_IN_BYTES;
            const bytes = new Uint8Array(messageTypeSize);
            bytes[0] = serial_message_types_1.SerialMessageTypes.end;
            yield this.send(bytes);
        });
        /**
         * Clears ping if ping is scheduled
         */
        this._clearScheduledPing = () => {
            if (this._pingTimeout !== undefined) {
                clearTimeout(this._pingTimeout);
                this._pingTimeout = undefined;
            }
        };
        /**
         * Clear current scheduled ping request and schedule new one.
         */
        this._schedulePing = (delay = 10000) => {
            this._pingTimeout = setTimeout(this.sendPing, delay);
        };
        this._clearPingTimer = () => {
            if (this._pingInterval) {
                clearInterval(this._pingInterval);
                this._pingInterval = undefined;
            }
        };
        this.display = (view) => __awaiter(this, void 0, void 0, function* () {
            const bytes = view.toBytes();
            yield this.send(bytes);
        });
        this.onData = onData;
        // @ts-ignore
        this.parser = new serialport_1.default.parsers.Readline({
            encoding: "binary",
        });
        this.parser.on("data", this._onData);
        this.port = new serialport_1.default(portName, {
            baudRate: baudRate !== null && baudRate !== void 0 ? baudRate : IciclesPort.defaultBaudRate,
        });
        this.port.pipe(this.parser);
    }
    get isSending() {
        return this._messagesToSend !== 0;
    }
    get pingsEnabled() {
        return this._pingInterval !== undefined || this._pingTimeout !== undefined;
    }
}
exports.IciclesPort = IciclesPort;
IciclesPort.defaultBaudRate = 921600;
