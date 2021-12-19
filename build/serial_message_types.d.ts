export declare enum SerialMessageTypes {
    /**
     * Keep leds aware of ongoing serial communication.
     *
     * Built-in animations are stopped.
     */
    ping = 0,
    displayView = 1,
    /**
     * End serial communication and start playing built-in animations
     */
    end = 10
}
