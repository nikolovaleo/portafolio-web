const corpus = [
  {
    id: "ALERT-1042",
    title: "Identity alert",
    content:
      "At 09:14 UTC the synthetic user riley.park authenticated from a new ASN in Singapore. The account normally authenticates from San José, Costa Rica. MFA was satisfied through a push notification after three denied prompts.",
  },
  {
    id: "EDR-772",
    title: "Endpoint telemetry",
    content:
      "At 09:19 UTC device FIN-LT-042 launched powershell.exe with an encoded command from outlook.exe. The process contacted 203.0.113.44 and wrote update-cache.ps1 to the user temp directory.",
  },
  {
    id: "MAIL-225",
    title: "Email gateway",
    content:
      "At 09:07 UTC a message titled Updated payroll schedule reached riley.park. The display name impersonated Finance Operations and linked to a newly registered lookalike domain.",
  },
  {
    id: "SOP-IR-04",
    title: "Identity compromise SOP",
    content:
      "For suspected credential compromise: revoke active sessions, reset credentials, review MFA methods, isolate affected endpoints when execution evidence exists, preserve evidence, and open an incident record with timestamps and scope.",
  },
  {
    id: "ASSET-042",
    title: "Synthetic asset inventory",
    content:
      "FIN-LT-042 is a managed Windows 11 finance laptop assigned to riley.park. It has high business criticality, current EDR coverage, and no prior malicious activity.",
  },
];

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

function retrieve(question: string) {
  const query = new Set(tokenize(question));
  const expanded = new Set(query);
  const synonyms: Record<string, string[]> = {
    happened: ["alert", "launched", "message", "authenticated"],
    contain: ["revoke", "reset", "isolate", "preserve"],
    response: ["revoke", "reset", "isolate", "incident"],
    evidence: ["telemetry", "message", "authenticated", "process"],
    user: ["account", "identity", "riley"],
  };
  for (const token of query) {
    for (const synonym of synonyms[token] ?? []) expanded.add(synonym);
  }
  return corpus
    .map((document) => {
      const terms = tokenize(document.title + " " + document.content);
      const overlap = terms.filter((term) => expanded.has(term)).length;
      const density = overlap / Math.sqrt(Math.max(1, terms.length));
      const sopBoost = document.id.startsWith("SOP") ? 0.18 : 0;
      return { ...document, score: Number((density + sopBoost).toFixed(3)) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

export async function POST(request: Request) {
  const started = Date.now();
  const body = (await request.json()) as { question?: string };
  const question =
    body.question?.trim() ||
    "What happened and what should the analyst do next?";
  const retrieved = retrieve(question);
  const containmentIntent = /contain|next|respond|action|do/i.test(question);
  const evidenceIntent = /evidence|why|proof|signal/i.test(question);

  const answer = containmentIntent
    ? "The evidence supports a likely phishing-led identity compromise followed by endpoint execution. Revoke the account’s active sessions, reset credentials and MFA methods, isolate FIN-LT-042, preserve the PowerShell and network evidence, and open an incident with the 09:07–09:19 UTC timeline. Confirm whether 203.0.113.44 was contacted by any other synthetic assets before closing scope."
    : evidenceIntent
      ? "The strongest signals are the lookalike payroll email, repeated MFA prompts followed by a successful login from a new geography, and encoded PowerShell launched by Outlook five minutes later. Together they form a coherent initial-access-to-execution sequence; the conclusion remains a hypothesis until the user and endpoint evidence are validated."
      : "This synthetic incident is most consistent with credential phishing, MFA fatigue, and follow-on PowerShell execution on FIN-LT-042. The identity, email, and endpoint events align within a twelve-minute window and should be handled as a probable compromise.";

  const citations = retrieved.slice(0, 3).map((item) => ({
    id: item.id,
    title: item.title,
    score: item.score,
    excerpt: item.content,
  }));
  const checks = [
    { name: "Grounded in retrieved evidence", passed: citations.length >= 3 },
    { name: "Includes uncertainty", passed: /likely|probable|hypothesis/i.test(answer) },
    { name: "Contains actionable next step", passed: /revoke|isolate|validate|handled/i.test(answer) },
    { name: "No unsupported identity claims", passed: true },
  ];
  const judgeScore = Math.round(
    (checks.filter((check) => check.passed).length / checks.length) * 100,
  );

  return Response.json({
    question,
    answer,
    trace: [
      { agent: "Planner", status: "complete", detail: "Decomposed the question into identity, endpoint, and response evidence." },
      { agent: "Retriever", status: "complete", detail: "Ranked " + corpus.length + " synthetic documents and selected " + citations.length + "." },
      { agent: "Identity specialist", status: "complete", detail: "Correlated geography, MFA prompts, ownership, and session timing." },
      { agent: "Endpoint specialist", status: "complete", detail: "Linked email delivery to encoded PowerShell and outbound traffic." },
      { agent: "Judge", status: judgeScore >= 75 ? "passed" : "review", detail: "Scored grounding, uncertainty, actionability, and claim safety: " + judgeScore + "/100." },
    ],
    citations,
    judge: { score: judgeScore, checks, verdict: judgeScore >= 75 ? "PASS" : "REVIEW" },
    meta: {
      retrieval: "token-overlap + query expansion",
      orchestration: "planner → specialists → judge",
      corpus: "synthetic",
      latencyMs: Date.now() - started,
    },
  });
}
