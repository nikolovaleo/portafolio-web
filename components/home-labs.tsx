"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type LabTab = { slug: string; name: string; tagline: string; summary: string; group: string; shows: readonly string[]; tryThis: readonly string[] };

/** Reads `?lab=<slug>` so a specific lab can be linked to; the server always renders the first tab. */
function initialFromUrl(labs: LabTab[]) {
  const slug = new URLSearchParams(window.location.search).get("lab");
  const index = labs.findIndex(lab => lab.slug === slug);
  return index;
}

export default function HomeLabs({ labs, panels }: { labs: LabTab[]; panels: ReactNode[] }) {
  const base = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const index = initialFromUrl(labs);
    // Syncing from the URL after hydration keeps server and client markup identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (index > 0) setActive(index);
  }, [labs]);

  function select(index: number, focus = false) {
    setActive(index);
    const tab = tabs.current[index];
    if (focus) tab?.focus();
    tab?.scrollIntoView({ block: "nearest", inline: "nearest" });
    const url = new URL(window.location.href);
    url.searchParams.set("lab", labs[index]!.slug);
    window.history.replaceState(window.history.state, "", url);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = labs.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(moves[event.key]!, true);
  }

  return <div className="lab-switcher">
    <div className="lab-tabs" role="tablist" aria-label="Interactive labs" onKeyDown={onKeyDown}>
      {labs.map((lab, index) => <button
        key={lab.slug}
        ref={element => { tabs.current[index] = element; }}
        type="button"
        role="tab"
        id={`${base}-tab-${lab.slug}`}
        aria-selected={index === active}
        aria-controls={`${base}-panel-${lab.slug}`}
        tabIndex={index === active ? 0 : -1}
        className="lab-tab"
        data-group-start={labs[index - 1]?.group !== lab.group || undefined}
        onClick={() => select(index)}
      >
        <span className="lab-tab-group">{lab.group}</span>
        <strong>{lab.name}</strong>
        <small>{lab.tagline}</small>
      </button>)}
    </div>
    {labs.map((lab, index) => <section
      key={lab.slug}
      role="tabpanel"
      id={`${base}-panel-${lab.slug}`}
      aria-labelledby={`${base}-tab-${lab.slug}`}
      hidden={index !== active}
      className="lab-panel"
    >
      <div className="lab-brief">
        <p className="lab-shows"><span>What this shows</span>{lab.shows.join(" · ")}</p>
        <ol className="try-this" aria-label="Try this">{lab.tryThis.map(step => <li key={step}>{step}</li>)}</ol>
      </div>
      {panels[index]}
      <footer className="lab-panel-foot">
        <p>{lab.summary}</p>
        <Link className="button button-secondary" href={`/projects/${lab.slug}`}>Open full lab &amp; case study <span aria-hidden="true">→</span></Link>
      </footer>
    </section>)}
  </div>;
}
