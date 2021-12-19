import SerialPort from "serialport";
import { AnimationView } from "icicles-animation";
export declare class IciclesPort {
    readonly portName: string;
    protected readonly parser: SerialPort.parsers.Readline;
    protected readonly port: SerialPort;
    constructor(portName: string, baudRate?: number);
    getPingMessage(): Uint8Array;
    private _messagesToSend;
    get isSending(): boolean;
    protected send(bytes: Uint8Array): Promise<void>;
    private _pingTimeout?;
    private _pingInterval?;
    get pingsEnabled(): boolean;
    private _pingEvery;
    /**
     * This method is also used internally to skip ping requests when there is no needed for them.
     */
    start({ pingEvery, }?: {
        pingEvery?: number;
    }): Promise<void>;
    private _reschedulePings;
    private _clearPings;
    stop(): Promise<void>;
    protected sendPing(): Promise<void>;
    protected sendEnd(): Promise<void>;
    /**
     * Clears ping if ping is scheduled
     */
    private _clearScheduledPing;
    /**
     * Clear current scheduled ping request and schedule new one.
     */
    private _schedulePing;
    private _clearPingTimer;
    display(view: AnimationView): Promise<void>;
}
