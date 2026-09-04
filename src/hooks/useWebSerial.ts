import { useCallback, useRef, useState } from "react";
import type { TelemetryPayload } from "../types";

// Minimal Web Serial API typings (not yet in default TS lib.dom.d.ts).
interface SerialPortLike {
  readable: ReadableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}
interface SerialLike {
  requestPort(): Promise<SerialPortLike>;
}
declare global {
  interface Navigator {
    serial?: SerialLike;
  }
}

export interface UseWebSerialResult {
  isSupported: boolean;
  isConnected: boolean;
  error: string | null;
  lastRawLine: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Opens a USB Serial connection to the ESP32 sensor hub at 115200 baud and
 * streams newline-delimited JSON telemetry packets. Gracefully reports
 * unsupported browsers (Web Serial is Chromium-only) and malformed lines
 * without crashing the ingestion pipeline — critical for live evaluation
 * where a flaky USB cable should degrade, not break, the demo.
 */
export function useWebSerial(onPacket: (packet: TelemetryPayload) => void): UseWebSerialResult {
  const isSupported = typeof navigator !== "undefined" && !!navigator.serial;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRawLine, setLastRawLine] = useState<string | null>(null);
  const portRef = useRef<SerialPortLike | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const keepReadingRef = useRef(false);

  const parseLine = useCallback(
    (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      setLastRawLine(trimmed);
      try {
        const obj = JSON.parse(trimmed);
        const packet: TelemetryPayload = {
          packetId: String(obj.packetId ?? `SERIAL-${Date.now()}`),
          sampleIndex: Number(obj.sampleIndex ?? 0),
          timestamp: String(obj.timestamp ?? new Date().toISOString()),
          lat: Number(obj.lat),
          lng: Number(obj.lng),
          moisture: Number(obj.moisture),
          temperature: Number(obj.temperature),
          ph: Number(obj.ph),
          nitrogen: Number(obj.nitrogen),
          phosphorus: Number(obj.phosphorus),
          potassium: Number(obj.potassium),
          landingStability: Number(obj.landingStability ?? 100),
          batteryPercent: obj.batteryPercent !== undefined ? Number(obj.batteryPercent) : undefined,
          recoveredFromSD: Boolean(obj.recoveredFromSD ?? false),
        };
        if (Number.isNaN(packet.lat) || Number.isNaN(packet.lng)) {
          throw new Error("packet missing lat/lng");
        }
        onPacket(packet);
      } catch (e) {
        // Malformed / partial line — common on boot or mid-write. Do not
        // surface as a hard error; just skip the line.
        console.warn("useWebSerial: skipped unparseable line:", trimmed, e);
      }
    },
    [onPacket]
  );

  const readLoop = useCallback(
    async (port: SerialPortLike) => {
      if (!port.readable) {
        setError("Serial port has no readable stream.");
        return;
      }
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(
        textDecoder.writable as unknown as WritableStream<Uint8Array>
      );
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;
      let buffer = "";
      try {
        while (keepReadingRef.current) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value ?? "";
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) parseLine(line);
        }
      } catch (e) {
        setError(`Serial read error: ${(e as Error).message}`);
      } finally {
        reader.releaseLock();
        await readableStreamClosed.catch(() => undefined);
      }
    },
    [parseLine]
  );

  const connect = useCallback(async () => {
    setError(null);
    if (!navigator.serial) {
      setError("Web Serial API is not supported in this browser. Use Chrome/Edge over HTTPS, or fall back to the Mock or File import data sources.");
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      keepReadingRef.current = true;
      setIsConnected(true);
      readLoop(port);
    } catch (e) {
      setError(`Could not open serial port: ${(e as Error).message}`);
      setIsConnected(false);
    }
  }, [readLoop]);

  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    try {
      readerRef.current?.cancel();
    } catch {
      /* no-op */
    }
    try {
      await portRef.current?.close();
    } catch {
      /* no-op */
    }
    portRef.current = null;
    setIsConnected(false);
  }, []);

  return { isSupported, isConnected, error, lastRawLine, connect, disconnect };
}
