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
    protected _onData: (chunk: any) => void;
    private _messagesToSend;
    get isSending(): boolean;
    send: (bytes: Uint8Array, { withPing }?: {
        withPing?: boolean | undefined;
    }) => Promise<void>;
    private _pingInterval?;
    get pingsEnabled(): boolean;
    /** Send ping every 10 second */
    private _pingEvery;
    /**
     * This method is also used internally to skip ping requests when there is no needed for them.
     */
    start: ({ pingEvery, }?: {
        pingEvery?: number | undefined;
    }) => Promise<void>;
    private _reschedulePings;
    private _clearPings;
    stop: () => Promise<void>;
    protected sendPing: () => Promise<void>;
    protected sendEnd: () => Promise<void>;
    private _clearPingTimer;
    display: (view: AnimationView) => Promise<void>;
}
