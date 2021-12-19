"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialMessageTypes = void 0;
var SerialMessageTypes;
(function (SerialMessageTypes) {
    /**
     * Keep leds aware of ongoing serial communication.
     *
     * Built-in animations are stopped.
     */
    SerialMessageTypes[SerialMessageTypes["ping"] = 0] = "ping";
    // display following frame
    SerialMessageTypes[SerialMessageTypes["displayView"] = 1] = "displayView";
    /**
     * End serial communication and start playing built-in animations
     */
    SerialMessageTypes[SerialMessageTypes["end"] = 10] = "end";
})(SerialMessageTypes = exports.SerialMessageTypes || (exports.SerialMessageTypes = {}));
