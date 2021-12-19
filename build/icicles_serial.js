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
const viewToSerial = (view) => {
    const getRadioPanelSize = () => {
        const panelIndexSize = utils_1.UINT_8_SIZE_IN_BYTES;
        const color = utils_1.UINT_8_SIZE_IN_BYTES * 3;
        return panelIndexSize + color;
    };
    const getFrameSize = () => {
        const colorsSize = view.frame.pixels.length * 3;
        // During serial communication frame duration and type is redundant;
        return colorsSize;
    };
    const radioPanelSize = getRadioPanelSize();
    const radioPanelsSize = radioPanelSize * view.radioPanels.length;
    const frameSize = getFrameSize();
    const messageTypeSize = utils_1.UINT_8_SIZE_IN_BYTES;
    const viewSize = messageTypeSize + frameSize + radioPanelsSize;
    const bytes = new Uint8Array(viewSize);
    let pointer = 0;
    // Set message type
    bytes[pointer++] = serial_message_types_1.SerialMessageTypes.displayView;
    /// frame pixels
    const pixels = view.frame.pixels;
    for (let i = 0; i < pixels.length; i++) {
        bytes[pointer++] = pixels[i].red;
        bytes[pointer++] = pixels[i].green;
        bytes[pointer++] = pixels[i].blue;
    }
    /// encode radio panels
    for (let i = 0; i < view.radioPanels.length; i++) {
        const radioPanelView = view.radioPanels[i];
        /// panel index
        bytes[pointer++] = radioPanelView.index;
        /// color
        bytes[pointer++] = radioPanelView.color.red;
        bytes[pointer++] = radioPanelView.color.green;
        bytes[pointer++] = radioPanelView.color.blue;
    }
    return bytes;
};
class IciclesPort {
    constructor(portName, baudRate = 921600) {
        this.portName = portName;
        this._messagesToSend = 0;
        this._pingEvery = 10000;
        // @ts-ignore
        this.parser = new serialport_1.default.parsers.Readline({
            encoding: "binary",
        });
        this.port = new serialport_1.default(portName, { baudRate });
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
            const bytes = viewToSerial(view);
            yield this.send(bytes);
        });
    }
}
exports.IciclesPort = IciclesPort;
