import SerialPort from "serialport";
import { AnimationView } from "icicles-animation";
export declare class IciclesPort {
    readonly portName: string;
    protected readonly parser: SerialPort.parsers.Readline;
    protected readonly port: SerialPort;
    protected readonly onData?: (chunk: any) => void;
    static readonly defaultBaudRate = 921600;
    constructor(portName: string, { onData, baudRate, }?: {
        onData?: (chunk: any) => void;
        baudRate?: number;
    });
    protected _onData(chunk: any): void;
    getPingMessage(): Uint8Array;
    private _messagesToSend;
    get isSending(): boolean;
    send: (bytes: Uint8Array) => Promise<void>;
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
