import SerialPort from "serialport";
import { AnimationView } from "icicles-animation";
import { UINT_8_SIZE_IN_BYTES } from "./utils";
import { SerialMessageTypes } from "./serial_message_types";

export class IciclesPort {
  protected readonly parser: SerialPort.parsers.Readline;
  protected readonly port: SerialPort;
  protected readonly onData?: (chunk: any) => void;
  public static readonly defaultBaudRate = 921600;
  constructor(
    public readonly portName: string,
    {
      onData,
      baudRate = IciclesPort.defaultBaudRate,
    }: { onData?: (chunk: any) => void; baudRate?: number } = {}
  ) {
    this.onData = onData;

    // @ts-ignore
    this.parser = new SerialPort.parsers.Readline({
      encoding: "binary",
    });
    this.parser.on("data", this._onData);
    this.port = new SerialPort(portName, {
      baudRate: baudRate ?? IciclesPort.defaultBaudRate,
    });
    this.port.pipe(this.parser);
  }

  protected _onData = (chunk: any) => {
    this.onData?.(chunk);
  };

  private _messagesToSend = 0;
  public get isSending(): boolean {
    return this._messagesToSend !== 0;
  }

  public send = async (
    bytes: Uint8Array,
    { withPing = true }: { withPing?: boolean } = {}
  ): Promise<void> => {
    this._messagesToSend++;

    // skip pings for [this._pingEvery] duration
    if (withPing) {
      this._reschedulePings(this._pingEvery);
    }
    const buffer = Buffer.from(bytes.buffer);
    await new Promise((res, rej) => {
      this.port.write(buffer, (err, bytesWritten) => {
        this._messagesToSend--;
        if (err) {
          rej(err);
        } else {
          res(bytesWritten);
        }
      });
    });
  };

  private _pingInterval?: NodeJS.Timer;
  public get pingsEnabled(): boolean {
    return this._pingInterval !== undefined;
  }

  /** Send ping every 10 second */
  private _pingEvery: number = 10_000;

  /**
   * This method is also used internally to skip ping requests when there is no needed for them.
   */
  public start = async ({
    pingEvery = 10_000,
  }: {
    pingEvery?: number;
  } = {}): Promise<void> => {
    if (typeof pingEvery === "number") {
      this._pingEvery = pingEvery;
    }
    this._reschedulePings(this._pingEvery);
    this.sendPing();
  };

  private _reschedulePings = (pingEvery: number) => {
    this._clearPings();
    this._pingInterval = setInterval(() => this.sendPing(), pingEvery);
  };

  private _clearPings = (): void => {
    this._clearPingTimer();
  };

  public stop = async (): Promise<void> => {
    this._clearPings();
    await this.sendEnd();
    this._clearPings();
  };

  protected sendPing = async (): Promise<void> => {
    const messageTypeSize = UINT_8_SIZE_IN_BYTES;
    const bytes = new Uint8Array(messageTypeSize);
    bytes[0] = SerialMessageTypes.ping;

    await this.send(bytes, { withPing: false });
  };

  protected sendEnd = async (): Promise<void> => {
    const messageTypeSize = UINT_8_SIZE_IN_BYTES;
    const bytes = new Uint8Array(messageTypeSize);
    bytes[0] = SerialMessageTypes.end;

    await this.send(bytes, { withPing: false });
  };

  private _clearPingTimer = (): void => {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = undefined;
    }
  };

  public display = async (view: AnimationView): Promise<void> => {
    const bytes = view.toBytes();
    await this.send(bytes);
  };
}
