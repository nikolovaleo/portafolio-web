import { analyzeGraph, incidentCases, remediations, runModelLab } from "@/lib/platform";
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
    const cases = Object.entries(incidentCases).map(([id, incident]) => ({ id, label: incident.label, reference: incident.id }));
    return <AegisLab cases={cases} variant={variant} />;
  }
  if (slug === "hermes") return <HermesLab initial={runTriageLab()} variant={variant} />;
  return <PrismLab initial={runRetrievalBench()} variant={variant} />;
}
