import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type LabVariant = "compact" | "full";

/** POSTs to a lab endpoint; responses from superseded requests are discarded. */
export function useLabEndpoint<T>(endpoint: string, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [latency, setLatency] = useState<number>();
  const latest = useRef(0);

  const run = useCallback(async (body: unknown) => {
    const request = ++latest.current;
    const started = performance.now();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(String(response.status));
      const result = (await response.json()) as T;
      if (request !== latest.current) return;
      setData(result);
      setLatency(Math.round(performance.now() - started));
    } catch {
      if (request === latest.current) setError("The live endpoint could not complete this run. Please try again.");
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [endpoint]);

  const reset = useCallback((value: T) => {
    latest.current++;
    setData(value);
    setLoading(false);
    setError("");
    setLatency(undefined);
  }, []);

  return { data, loading, error, latency, run, reset };
}

export function EndpointBadge({ endpoint, latency, loading }: { endpoint: string; latency?: number; loading?: boolean }) {
  const state = loading ? "running…" : latency === undefined ? "ready" : `${latency} ms`;
  return <p className="endpoint-badge"><span>POST</span><code>{endpoint}</code><small data-loading={loading || undefined}>{state}</small></p>;
}

export function Metric({ label, value, detail, tone }: { label: string; value: ReactNode; detail?: ReactNode; tone?: "good" | "warn" | "alert" }) {
  return <div className="metric"><dt>{label}</dt><dd><strong>{value}</strong>{detail !== undefined && <small data-tone={tone}>{detail}</small>}</dd></div>;
}

export function LabError({ message }: { message: string }) {
  return message ? <p role="alert" className="lab-error">{message}</p> : null;
}

export function RangeField({ id, label, value, min, max, format, onChange, disabled }: { id: string; label: string; value: number; min: number; max: number; format: (value: number) => string; onChange: (value: number) => void; disabled?: boolean }) {
  const fill = ((value - min) / (max - min)) * 100;
  return <div className="range-field" data-disabled={disabled || undefined}>
    <div className="range-head"><label htmlFor={id}>{label}</label><output htmlFor={id}>{format(value)}</output></div>
    <input id={id} type="range" min={min} max={max} step={1} value={value} disabled={disabled} aria-valuetext={format(value)} style={{ "--fill": `${fill}%` } as CSSProperties} onChange={event => onChange(Number(event.target.value))} />
  </div>;
}

export function LiveSummary({ children }: { children: ReactNode }) {
  return <p className="visually-hidden" aria-live="polite" aria-atomic="true">{children}</p>;
}
