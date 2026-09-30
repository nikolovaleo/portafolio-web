import scorecard from "@/lib/data/aegis-eval.json";
import { agentCases } from "@/lib/aegis-cases";
import { liveStatus } from "@/lib/aegis-service";
import { analyzeGraph, remediations, runModelLab } from "@/lib/platform";
import { runRetrievalBench } from "@/lib/retrieval-bench";
import type { ProjectSlug } from "@/lib/projects";
import { runTriageLab } from "@/lib/triage";
import { AegisLab } from "./aegis-lab";
import { AtlasLab } from "./atlas-lab";
import { HermesLab } from "./hermes-lab";
import type { LabVariant } from "./lab-kit";
import { PrismLab } from "./prism-lab";
import { SentinelLab } from "./sentinel-lab";

export function ProjectLab({ slug, variant }: { slug: ProjectSlug; variant: LabVariant }) {
  if (slug === "atlas") {
    return <AtlasLab initial={analyzeGraph("none")} remediations={remediations.map(({ id, label }) => ({ id, label }))} variant={variant} />;
  }
  if (slug === "sentinel") return <SentinelLab initial={runModelLab()} variant={variant} />;
  if (slug === "aegis") {
    const cases = Object.entries(agentCases).map(([id, incident]) => ({ id, label: incident.label, reference: incident.id, kind: incident.kind, templated: incident.templated }));
    const agent = { model: scorecard.model, promptVersion: scorecard.promptVersion, createdAt: scorecard.createdAt, live: liveStatus().available, passes: scorecard.cases.reduce((sum, item) => sum + item.agent.passes, 0), runs: scorecard.summary.runs };
    return <AegisLab cases={cases} variant={variant} agent={agent} />;
  }
  if (slug === "hermes") return <HermesLab initial={runTriageLab()} variant={variant} />;
  return <PrismLab initial={runRetrievalBench()} variant={variant} />;
}
