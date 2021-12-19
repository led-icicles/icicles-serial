import SerialPort from "serialport";
import { AnimationView } from "icicles-animation";
import { UINT_8_SIZE_IN_BYTES } from "./utils";
import { SerialMessageTypes } from "./serial_message_types";

const viewToSerial = (view: AnimationView): Uint8Array => {
  const getRadioPanelSize = () => {
    const panelIndexSize = UINT_8_SIZE_IN_BYTES;
    const color = UINT_8_SIZE_IN_BYTES * 3;
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
  const messageTypeSize = UINT_8_SIZE_IN_BYTES;
  const viewSize = messageTypeSize + frameSize + radioPanelsSize;

  const bytes = new Uint8Array(viewSize);
  let pointer = 0;

  // Set message type
  bytes[pointer++] = SerialMessageTypes.displayView;
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

export class IciclesPort {
  protected readonly parser: SerialPort.parsers.Readline;
  protected readonly port: SerialPort;

  constructor(public readonly portName: string, baudRate: number = 921600) {
    // @ts-ignore
    this.parser = new SerialPort.parsers.Readline({
      encoding: "binary",
    });

    this.port = new SerialPort(portName, { baudRate });
  }

  public getPingMessage(): Uint8Array {
    const bytes = new Uint8Array(UINT_8_SIZE_IN_BYTES);
    bytes[0] = SerialMessageTypes.ping;
    return bytes;
  }

  private _messagesToSend = 0;
  public get isSending(): boolean {
    return this._messagesToSend !== 0;
  }

  protected async send(bytes: Uint8Array): Promise<void> {
    this._messagesToSend++;

    // skip pings for [this._pingEvery] duration
    this._reschedulePings(this._pingEvery);
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
  }

  private _pingTimeout?: NodeJS.Timeout;
  private _pingInterval?: NodeJS.Timer;
  public get pingsEnabled(): boolean {
    return this._pingInterval !== undefined || this._pingTimeout !== undefined;
  }

  private _pingEvery: number = 10_000;

  /**
   * This method is also used internally to skip ping requests when there is no needed for them.
   */
  public async start({
    pingEvery = 10_000,
  }: {
    pingEvery?: number;
  } = {}): Promise<void> {
    if (typeof pingEvery === "number") {
      this._pingEvery = pingEvery;
    }
    this._reschedulePings(this._pingEvery);
    this.sendPing();
  }

  private _reschedulePings(pingEvery: number) {
    this._clearPings();
    this._pingInterval = setInterval(
      () => this._schedulePing(pingEvery),
      pingEvery
    );
  }

  private _clearPings(): void {
    this._clearPingTimer();
    this._clearScheduledPing();
  }

  public async stop(): Promise<void> {
    this._clearPings();
    await this.sendEnd();
  }

  protected async sendPing(): Promise<void> {
    const messageTypeSize = UINT_8_SIZE_IN_BYTES;
    const bytes = new Uint8Array(messageTypeSize);
    bytes[0] = SerialMessageTypes.ping;

    await this.send(bytes);
  }

  protected async sendEnd(): Promise<void> {
    const messageTypeSize = UINT_8_SIZE_IN_BYTES;
    const bytes = new Uint8Array(messageTypeSize);
    bytes[0] = SerialMessageTypes.end;

    await this.send(bytes);
  }

  /**
   * Clears ping if ping is scheduled
   */
  private _clearScheduledPing(): void {
    if (this._pingTimeout !== undefined) {
      clearTimeout(this._pingTimeout);
      this._pingTimeout = undefined;
    }
  }

  /**
   * Clear current scheduled ping request and schedule new one.
   */
  private _schedulePing(delay: number = 10_000): void {
    this._pingTimeout = setTimeout(this.sendPing, delay);
  }

  private _clearPingTimer(): void {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = undefined;
    }
  }

  public async display(view: AnimationView): Promise<void> {
    const bytes = viewToSerial(view);
    await this.send(bytes);
  }
}
