"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { email, resumePath } from "@/lib/profile";

type ActiveSectionOptions = {
  enabled?: boolean;
  /**
   * Where the reading line sits, as a fraction of the viewport height. It never rises above the
   * sticky header plus the anchor scroll margin, so a freshly targeted anchor is always the active one.
   */
  fraction?: number;
};

/**
 * Returns the id of the section currently under the reading line, or "" when none of them is.
 * Sections that have no link still claim their region, so nothing is highlighted while the
 * reader is between linked sections.
 */
export function useActiveSection(ids: readonly string[], { enabled = true, fraction = 0.35 }: ActiveSectionOptions = {}) {
  const [active, setActive] = useState("");

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 60;
      const line = Math.max(navHeight + 48, window.innerHeight * fraction);
      let current = "";
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= line) current = id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && ids.length) current = ids[ids.length - 1]!;
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ids, enabled, fraction]);

  return enabled ? active : "";
}

/** Homepage sections in document order; the footer and the expertise rail claim their regions without a link. */
const homeSections = ["work", "labs", "expertise", "experience", "contact"] as const;

export function NavLinks() {
  const pathname = usePathname();
  const home = pathname === "/";
  const scrolled = useActiveSection(homeSections, { enabled: home });
  // On the homepage the highlight follows the scroll position; a project page belongs to the labs.
  const current = home ? scrolled : pathname.startsWith("/projects/") ? "labs" : "";
  const mark = (id: string) => (current !== id ? undefined : home ? ("location" as const) : ("true" as const));

  return <div className="nav-links">
    <Link href="/#work" aria-current={mark("work")}>Work</Link>
    <Link href="/#labs" aria-current={mark("labs")}>Labs</Link>
    <Link className="nav-optional" href="/#experience" aria-current={mark("experience")}>Experience</Link>
    <a href={resumePath}>Résumé</a>
    <a className="nav-cta" href={`mailto:${email}`}>Contact</a>
  </div>;
}

/** Sticky table of contents for the engineering notes on a project page. */
export function CaseIndex({ notes }: { notes: ReadonlyArray<{ id: string; title: string }> }) {
  const ids = useMemo(() => notes.map(note => `note-${note.id}`), [notes]);
  // Notes are short, so the line sits just under the header rather than a third of the way down.
  const active = useActiveSection(ids, { fraction: 0.1 });
  return <nav className="case-index" aria-label="Engineering notes">
    <ol>{notes.map(note => <li key={note.id}>
      <a href={`#note-${note.id}`} aria-current={active === `note-${note.id}` ? "location" : undefined}>{note.title}</a>
    </li>)}</ol>
  </nav>;
}
