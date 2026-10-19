import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type LabVariant = "compact" | "full";

/** Turns a failed lab request into a message that says what happened and what to do next. */
function describeFailure(status?: number) {
  if (status === undefined) return "Could not reach the lab endpoint. Check your connection, then try again.";
  if (status === 400) return "The endpoint rejected these inputs. Reset the controls or choose another option.";
  if (status === 413) return "That input is too large for this demo. Shorten it and try again.";
  if (status === 429) return "Too many runs in a short time. Wait a moment, then try again.";
  return `The lab endpoint returned an error (${status}). The last good result is still shown; try again.`;
}

class EndpointError extends Error {
  status: number;
  constructor(status: number) {
    super(String(status));
    this.status = status;
  }
}

/** POSTs to a lab endpoint; responses from superseded requests are discarded, and the last request can be retried. */
export function useLabEndpoint<T>(endpoint: string, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [latency, setLatency] = useState<number>();
  const latest = useRef(0);
  const lastBody = useRef<unknown>(undefined);

  const run = useCallback(async (body: unknown) => {
    const request = ++latest.current;
    const started = performance.now();
    lastBody.current = body;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new EndpointError(response.status);
      const result = (await response.json()) as T;
      if (request !== latest.current) return;
      setData(result);
      setLatency(Math.round(performance.now() - started));
    } catch (failure) {
      if (request === latest.current) setError(describeFailure(failure instanceof EndpointError ? failure.status : undefined));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [endpoint]);

  const retry = useCallback(() => {
    if (lastBody.current !== undefined) void run(lastBody.current);
  }, [run]);

  const reset = useCallback((value: T) => {
    latest.current++;
    lastBody.current = undefined;
    setData(value);
    setLoading(false);
    setError("");
    setLatency(undefined);
  }, []);

  return { data, loading, error, latency, run, retry, reset };
}

export function EndpointBadge({ endpoint, latency, loading }: { endpoint: string; latency?: number; loading?: boolean }) {
  const state = loading ? "Running…" : latency === undefined ? "Ready" : `${latency} ms`;
  return <p className="endpoint-badge"><span>POST</span><code translate="no">{endpoint}</code><small data-loading={loading || undefined}>{state}</small></p>;
}

export function Metric({ label, value, detail, tone }: { label: string; value: ReactNode; detail?: ReactNode; tone?: "good" | "warn" | "alert" }) {
  return <div className="metric"><dt>{label}</dt><dd><strong>{value}</strong>{detail !== undefined && <small data-tone={tone}>{detail}</small>}</dd></div>;
}

export function LabError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return <div role="alert" className="lab-error">
    <p>{message}</p>
    {onRetry && <button type="button" className="button button-secondary button-small" onClick={onRetry}>Try again</button>}
  </div>;
}

export function RangeField({ id, label, value, min, max, format, onChange, disabled }: { id: string; label: string; value: number; min: number; max: number; format: (value: number) => string; onChange: (value: number) => void; disabled?: boolean }) {
  const fill = ((value - min) / (max - min)) * 100;
  return <div className="range-field" data-disabled={disabled || undefined}>
    <div className="range-head"><label htmlFor={id}>{label}</label><output htmlFor={id}>{format(value)}</output></div>
    <input id={id} type="range" min={min} max={max} step={1} value={value} disabled={disabled} aria-valuetext={format(value)} style={{ "--fill": `${fill}%` } as CSSProperties} onChange={event => onChange(Number(event.target.value))} />
  </div>;
}

/** Remaining-characters hint for free-text inputs. */
export function CharacterCount({ id, length, max }: { id: string; length: number; max: number }) {
  return <span id={id} className="char-count" data-near={length > max * 0.9 || undefined}>{length.toLocaleString("en-US")} / {max.toLocaleString("en-US")}</span>;
}

export function LiveSummary({ children }: { children: ReactNode }) {
  return <p className="visually-hidden" aria-live="polite" aria-atomic="true">{children}</p>;
}
