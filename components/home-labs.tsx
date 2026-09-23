"use client";

import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type LabTab = { slug: string; name: string; tagline: string; accent: string; summary: string; group: string };

function groupRanges(labs: LabTab[]) {
  const ranges: Array<{ group: string; start: number; count: number }> = [];
  for (let index = 0; index < labs.length; index++) {
    const last = ranges[ranges.length - 1];
    if (last && last.group === labs[index]!.group) last.count++;
    else ranges.push({ group: labs[index]!.group, start: index, count: 1 });
  }
  return ranges;
}

export default function HomeLabs({ labs, panels }: { labs: LabTab[]; panels: ReactNode[] }) {
  const base = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const groups = groupRanges(labs);

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
    setActive(moves[event.key]!);
    tabs.current[moves[event.key]!]?.focus();
  }

  return <div className="lab-switcher">
    <div className="lab-group-captions" aria-hidden="true">
      {groups.map(group => <p key={group.group} data-span={group.count}>{group.group}</p>)}
    </div>
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
        className={`lab-tab accent-${lab.accent}`}
        onClick={() => setActive(index)}
      >
        <span className="lab-tab-index">0{index + 1}</span>
        <span className="lab-tab-text"><strong>{lab.name}</strong><small>{lab.tagline}</small></span>
      </button>)}
    </div>
    {labs.map((lab, index) => <section
      key={lab.slug}
      role="tabpanel"
      id={`${base}-panel-${lab.slug}`}
      aria-labelledby={`${base}-tab-${lab.slug}`}
      hidden={index !== active}
      className={`lab-panel accent-${lab.accent}`}
    >
      {panels[index]}
      <footer className="lab-panel-foot">
        <p>{lab.summary}</p>
        <Link className="button button-outline" href={`/projects/${lab.slug}`}>Open full lab &amp; case study <span aria-hidden="true">→</span></Link>
      </footer>
    </section>)}
  </div>;
}
