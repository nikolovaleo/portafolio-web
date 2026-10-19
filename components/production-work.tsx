import { ArchitectureFlow } from "@/components/architecture-flow";
import { productionWork } from "@/lib/profile";

/** Stryker production systems, described at the level of detail already public in the CV. */
export function ProductionWork() {
  return <section className="section work" id="work" aria-labelledby="work-title">
    <div className="container">
      <header className="section-intro">
        <p className="eyebrow">Production work at Stryker</p>
        <h2 id="work-title">Four systems running in production.</h2>
        <p>Since 2023 I have led data science for cybersecurity at Stryker. Each system is described at a non-confidential level, with the outcome first.</p>
      </header>
      <div className="work-grid">
        {productionWork.map(system => <article key={system.id} className={`work-card work-${system.id}`} aria-labelledby={`work-${system.id}-title`}>
          <h3 id={`work-${system.id}-title`}>{system.title}</h3>
          <p className="work-outcome">{system.outcome}</p>
          {system.flow && <ArchitectureFlow stages={system.flow} label={`${system.title} architecture`} caption="Simplified, non-confidential view of the production architecture." compact />}
          <dl className="work-notes">
            <div><dt>What it does</dt><dd>{system.body}</dd></div>
            <div><dt>{system.evaluationLabel ?? "How it is evaluated"}</dt><dd>{system.evaluation}</dd></div>
          </dl>
          <ul className="chip-list" aria-label="Techniques and stack">{system.stack.map(item => <li key={item} translate="no">{item}</li>)}</ul>
        </article>)}
      </div>
    </div>
  </section>;
}
