import { analyzeGraph, remediations } from "@/lib/platform";

export async function POST(request: Request) {
  let body: { remediation?: string };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const remediation = typeof body?.remediation === "string" ? body.remediation : "none";
  if (!remediations.some(item => item.id === remediation)) return Response.json({ error: "Unknown remediation" }, { status: 400 });
  return Response.json(analyzeGraph(remediation));
}
