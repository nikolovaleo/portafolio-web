import { incidentCases, investigateIncident } from "@/lib/platform";
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 8192) return Response.json({error:"Request too large"},{status:413});
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({error:"Invalid JSON"},{status:400}); }
  const question = body && typeof body === "object" && "question" in body ? body.question : undefined;
  if (typeof question !== "string" || question.trim().length < 3 || question.length > 1000) return Response.json({error:"Question must be 3–1000 characters."},{status:400});
  const caseId = body && typeof body === "object" && "caseId" in body ? body.caseId : "identity";
  const approved = Boolean(body && typeof body === "object" && "approved" in body && body.approved);
  if (typeof caseId !== "string" || !(caseId in incidentCases)) return Response.json({ error: "Unknown incident case" }, { status: 400 });
  return Response.json(investigateIncident(caseId as keyof typeof incidentCases, question.trim(), approved));
}
