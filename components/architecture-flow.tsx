import type { FlowStage } from "@/lib/profile";

/**
 * A left-to-right system diagram built from an ordered list, so it reads in sequence for
 * screen readers and collapses to a vertical rail on narrow screens. A stage with `group`
 * renders its parallel parts stacked inside one column.
 */
export function ArchitectureFlow({ stages, label, caption, compact = false }: { stages: ReadonlyArray<FlowStage>; label: string; caption?: string; compact?: boolean }) {
  return <figure className="flow" data-compact={compact || undefined} style={{ "--flow-count": stages.length } as React.CSSProperties}>
    <ol className="flow-stages" aria-label={label}>
      {stages.map(stage => <li key={stage.title} className="flow-stage" data-group={stage.group ? true : undefined}>
        {stage.group
          ? <>
            <span className="flow-group-label">{stage.title}</span>
            <ul className="flow-group">{stage.group.map(part => <li key={part.title}><strong>{part.title}</strong><span>{part.detail}</span></li>)}</ul>
          </>
          : <><strong>{stage.title}</strong><span>{stage.detail}</span></>}
      </li>)}
    </ol>
    {caption && <figcaption>{caption}</figcaption>}
  </figure>;
}
