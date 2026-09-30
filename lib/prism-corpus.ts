/** Synthetic security knowledge base and graded relevance judgments shared by Prism Bench and Aegis. */
export type Document = { id: string; title: string; text: string };
export type Slice = "exact" | "paraphrase" | "acronym" | "typo" | "multi";
export type Query = { id: string; text: string; slice: Slice; relevant: Record<string, number> };

export const documents: Document[] = [
  { id: "KB-01", title: "Phishing-resistant MFA enrollment", text: "Require phishing-resistant multifactor authentication for privileged users. FIDO2 security keys replace SMS and push prompts. Enrollment is handled at the identity gateway." },
  { id: "KB-02", title: "Session revocation after takeover", text: "Revoke active sessions, reset credentials, inspect multifactor methods, and preserve timestamps when an identity is suspected compromised." },
  { id: "KB-03", title: "Cloud credential rotation", text: "Disable the exposed service credential, rotate dependent secrets, review warehouse reads, and preserve cloud audit logs before any remediation." },
  { id: "KB-04", title: "Least privilege for warehouse roles", text: "Remove standing write access to the data warehouse. Finance applications should use least privilege roles reviewed quarterly." },
  { id: "KB-05", title: "Backup network segmentation", text: "Segment the backup vault from the warehouse replication path. Network segmentation removes the remaining hop to critical archives." },
  { id: "KB-06", title: "Endpoint detection isolation", text: "Endpoint detection and response isolation contains a compromised laptop. Capture process evidence, block confirmed indicators, then reimage." },
  { id: "KB-07", title: "Public API web application firewall", text: "Apply a web application firewall policy to the public API. The WAF sits in front of the exposed service and drops unauthenticated probes." },
  { id: "KB-08", title: "Entity resolution field matching", text: "Join duplicate device records with weighted field comparison. Hostname, device id, and owner agreement produce a match; borderline pairs go to review." },
  { id: "KB-09", title: "Population stability index monitor", text: "The population stability index measures covariate drift between a reference score distribution and live traffic. Raise a watch when PSI exceeds 0.1." },
  { id: "KB-10", title: "Identity compromise procedure", text: "Procedure for identity takeover: revoke sessions, reset credentials, inspect MFA, isolate the assigned endpoint if execution evidence is present." },
  { id: "KB-11", title: "Cloud credential procedure", text: "Procedure for leaked cloud keys: disable the credential, rotate secrets, review data access, and keep audit evidence." },
  { id: "KB-12", title: "Endpoint malware procedure", text: "Procedure for endpoint execution: isolate the host, collect process and network evidence, block indicators, and scope related devices." },
  { id: "KB-13", title: "Evidence quality policy", text: "Every material claim must cite a returned tool record. Missing evidence produces an explicit abstention rather than an inferred fact." },
  { id: "KB-14", title: "Attack path enumeration", text: "Enumerate every path from an external entry point to critical data. Path score multiplies assumed edge likelihoods to rank exposure." },
  { id: "KB-15", title: "Conditional access for finance SSO", text: "Require device compliance and phishing-resistant MFA before the identity gateway issues a finance application session." },
  { id: "KB-16", title: "Secret rotation for public API", text: "Rotate the public API service credential on a 30-day cycle. Stale service credentials are a common warehouse path." },
  { id: "KB-17", title: "CMDB and EDR record hygiene", text: "Configuration management and endpoint records describe the same laptop with different identifiers. Normalize hostname and owner before graph join." },
  { id: "KB-18", title: "Wire transfer impersonation response", text: "Business email compromise requesting a wire transfer is handled as impersonation. Verify the request out of band and freeze the beneficiary payment." },
  { id: "KB-19", title: "Lookalike domain takedown", text: "Payroll lookalike domains harvest direct-deposit updates. Block the domain, warn staff, and reset any submitted credentials." },
  { id: "KB-20", title: "Authentication overview", text: "Authentication covers passwords, sessions, tokens, and device posture. Long-lived sessions and reused passwords remain a common failure mode across applications." },
  { id: "KB-21", title: "Network overview", text: "Networks connect public services, identity gateways, finance applications, warehouses, and backup archives. Segmentation and firewall policy bound east-west movement." },
  { id: "KB-22", title: "Data warehouse access review", text: "Warehouse access reviews list every identity with read or write roles. Standing write access should be removed unless a ticket justifies it." },
  { id: "KB-23", title: "Incident evidence collection", text: "Collect identity, endpoint, threat intelligence, and graph context before recommending containment. Do not execute containment without approval." },
  { id: "KB-24", title: "Threshold selection for classifiers", text: "A classifier threshold trades recall for analyst workload. Lowering the threshold catches more attacks and sends more benign mail to review." },
  { id: "KB-25", title: "BM25 lexical retrieval notes", text: "BM25 ranks documents by term frequency with inverse document frequency. Exact rare terms dominate. Typos and acronyms without expansion miss." },
  { id: "KB-26", title: "Character n-gram retrieval notes", text: "Character trigram vectors recover misspellings through overlapping substrings. They are lexical features, not neural embeddings, and can dilute exact rare terms." },
  { id: "KB-27", title: "Hybrid rank fusion notes", text: "Reciprocal rank fusion combines independent rankings. A hybrid of BM25 and character n-grams often lifts typos without giving up exact-term recall." },
  { id: "KB-28", title: "Query expansion lexicon", text: "A curated thesaurus expands acronyms such as EDR, MFA, PSI, SOP, BEC, CMDB, and WAF into the phrases operators actually wrote in procedures." },
  { id: "KB-29", title: "Release gate for retrieval changes", text: "Promote a retriever only when recall at k rises, MRR does not drop, and no query slice regresses by more than ten points against the frozen baseline." },
  { id: "KB-30", title: "SOC investigation workflow", text: "Investigations retrieve trusted procedures, cite tool evidence, and pause at a human approval gate. Retrieval quality determines whether the right procedure is on the page." },
  { id: "KB-31", title: "Acronym disambiguation glossary", text: "MFA also means mail forwarding alias and metadata file archive. EDR is a drawing revision. PSI is a pressure unit. SOP is a start-of-packet flag. BEC is a billing entity code. CMDB is sometimes misread as a commute database. WAF is used here as a warehouse allocation forecast. These senses are unrelated to the security procedures." },
  { id: "KB-32", title: "Operations status log", text: "Warehouse role write index monitor field matching public API session login path hop archives data finance application identity gateway laptop records extra access stolen login keeping a session. The log lists tokens without stating the control that should be applied." },
];

export const queries: Query[] = [
  { id: "Q01", text: "phishing-resistant MFA", slice: "exact", relevant: { "KB-01": 2, "KB-15": 1 } },
  { id: "Q02", text: "least privilege warehouse write role", slice: "exact", relevant: { "KB-04": 2, "KB-22": 1 } },
  { id: "Q03", text: "backup network segmentation", slice: "exact", relevant: { "KB-05": 2, "KB-21": 1 } },
  { id: "Q04", text: "web application firewall public API", slice: "exact", relevant: { "KB-07": 2, "KB-16": 1 } },
  { id: "Q05", text: "population stability index monitor", slice: "exact", relevant: { "KB-09": 2, "KB-24": 1 } },
  { id: "Q06", text: "entity resolution field matching", slice: "exact", relevant: { "KB-08": 2, "KB-17": 1 } },
  { id: "Q07", text: "stop a stolen login from keeping a session", slice: "paraphrase", relevant: { "KB-02": 2, "KB-10": 1 } },
  { id: "Q08", text: "remove extra access to finance data", slice: "paraphrase", relevant: { "KB-04": 2, "KB-22": 1 } },
  { id: "Q09", text: "how do we join duplicate laptop records", slice: "paraphrase", relevant: { "KB-08": 2, "KB-17": 1 } },
  { id: "Q10", text: "cut the last hop to the archives", slice: "paraphrase", relevant: { "KB-05": 2, "KB-14": 1 } },
  { id: "Q11", text: "keep a retrieval change from quietly getting worse", slice: "paraphrase", relevant: { "KB-29": 2, "KB-27": 1 } },
  { id: "Q12", text: "EDR containment steps", slice: "acronym", relevant: { "KB-06": 2, "KB-12": 1 } },
  { id: "Q13", text: "PSI drift alerting", slice: "acronym", relevant: { "KB-09": 2, "KB-24": 1 } },
  { id: "Q14", text: "SOP for BEC wire payment", slice: "acronym", relevant: { "KB-18": 2, "KB-10": 1 } },
  { id: "Q15", text: "CMDB join with EDR", slice: "acronym", relevant: { "KB-17": 2, "KB-08": 1 } },
  { id: "Q16", text: "WAF in front of the public API", slice: "acronym", relevant: { "KB-07": 2, "KB-16": 1 } },
  { id: "Q17", text: "phising resistant mfa", slice: "typo", relevant: { "KB-01": 2, "KB-15": 1 } },
  { id: "Q18", text: "endpont isolation", slice: "typo", relevant: { "KB-06": 2, "KB-12": 1 } },
  { id: "Q19", text: "sesion revocation after takeover", slice: "typo", relevant: { "KB-02": 2, "KB-10": 1 } },
  { id: "Q20", text: "least privlege warehouse role", slice: "typo", relevant: { "KB-04": 2, "KB-22": 1 } },
  { id: "Q21", text: "popultion stability index", slice: "typo", relevant: { "KB-09": 2, "KB-24": 1 } },
  { id: "Q22", text: "entity reslution matching", slice: "typo", relevant: { "KB-08": 2, "KB-17": 1 } },
  { id: "Q23", text: "contain an identity takeover", slice: "multi", relevant: { "KB-10": 2, "KB-02": 2, "KB-01": 1 } },
  { id: "Q24", text: "respond to leaked cloud key", slice: "multi", relevant: { "KB-11": 2, "KB-03": 2, "KB-16": 1 } },
  { id: "Q25", text: "close paths to critical data", slice: "multi", relevant: { "KB-14": 2, "KB-04": 1, "KB-05": 1 } },
  { id: "Q26", text: "investigate endpoint execution with evidence", slice: "multi", relevant: { "KB-12": 2, "KB-06": 1, "KB-13": 1 } },
  { id: "Q27", text: "replace keyword procedure search safely", slice: "multi", relevant: { "KB-29": 2, "KB-27": 1, "KB-30": 1 } },
  { id: "Q28", text: "score reported mail and set a threshold", slice: "multi", relevant: { "KB-24": 2, "KB-19": 1 } },
];

export const lexicon: Record<string, string[]> = {
  edr: ["endpoint", "detection", "response", "isolation"],
  mfa: ["multifactor", "authentication", "fido", "phishing-resistant"],
  psi: ["population", "stability", "index", "drift"],
  sop: ["procedure", "playbook"],
  bec: ["wire", "transfer", "beneficiary", "impersonation"],
  cmdb: ["configuration", "management", "inventory", "asset"],
  waf: ["web", "application", "firewall"],
  stolen: ["compromised", "takeover"],
  archives: ["backup", "vault", "segmentation"],
  extra: ["standing", "privilege"],
  quietly: ["regress", "gate", "promote"],
};

export const tokenize = (text: string) => text.toLowerCase().match(/[a-z0-9][a-z0-9-]{1,}/g) ?? [];

export function expandQuery(text: string, expansion: boolean) {
  const tokens = tokenize(text);
  if (!expansion) return tokens;
  const extra = tokens.flatMap(token => lexicon[token] ?? []);
  return [...tokens, ...extra];
}

/** The text a vector retriever sees for a query: the original words plus any lexicon expansion. */
export function vectorQueryText(text: string, expansion: boolean) {
  return expansion ? `${text} ${expandQuery(text, true).join(" ")}` : text;
}

export const documentText = (document: Document) => `${document.title}. ${document.text}`;

/** FNV-1a hash used to detect embeddings that are stale relative to the corpus text. */
export function textHash(text: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
