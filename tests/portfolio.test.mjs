import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import worker from "../dist/server/index.js";
const env = { ASSETS: { fetch: async () => new Response("Not found",{status:404}) } };
const ctx = {waitUntil(){},passThroughOnException(){}};
const request = (path, body) => worker.fetch(new Request("http://localhost"+path,body === undefined ? {} : {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),env,ctx);
test("homepage and project routes render distinct content", async () => {
  for (const [path, expected] of [["/","Working systems, not screenshots."],["/projects/atlas","Atlas Graph"],["/projects/sentinel","Sentinel ModelOps"],["/projects/aegis","Aegis Investigator"],["/projects/hermes","Hermes Triage"],["/projects/prism","Prism Bench"]]) {
    const result = await request(path);
    assert.equal(result.status,200,path);
    const html = await result.text();
    assert.ok(html.includes(expected),path);
    assert.ok(!html.includes(">ONLINE<"),path);
    assert.ok(html.includes("/Leonardo-Urena-CV.pdf"));
    assert.ok(html.includes("Not an employer system") || html.includes("Not employer systems"),path);
  }
  assert.equal((await request("/projects/missing")).status,404);
});
test("homepage establishes AI and data science expertise with evidence", async () => {
  const html = await (await request("/")).text();
  for (const expected of ["AI &amp; Data Science","Agentic AI","RAG systems","200K+","Weeks → minutes","Data foundation","Generative AI","Evaluation","Production","89.93%"])
    assert.ok(html.includes(expected),expected);
});
test("homepage embeds all five labs as usable, server-rendered tabs", async () => {
  const html = await (await request("/")).text();
  assert.ok(html.includes('role="tablist"'));
  assert.equal(html.match(/role="tabpanel"/g)?.length,5);
  for (const expected of ["Reachable critical paths","Population drift","Run investigation","Auto-close threshold","Query expansion","/api/graph","/api/monitor","/api/agent","/api/triage","/api/retrieval"])
    assert.ok(html.includes(expected),expected);
  assert.ok(html.includes("not LLM evaluation") || html.includes("Not LLM evaluation"));
  const skip = html.indexOf("Skip to content"), navEnd = html.indexOf("</nav>"), main = html.indexOf('<main id="content"');
  assert.ok(skip > -1 && skip < navEnd && navEnd < main, "skip link must precede the nav and target main content");
});
test("Aegis executes typed tools, cites evidence, and gates action", async () => {
  const result = await (await request("/api/agent",{caseId:"identity",question:"What happened and what should we do?"})).json();
  assert.equal(result.toolCalls.length,4);
  assert.ok(result.toolCalls.every(call => call.input && call.output.record));
  assert.equal(result.action.status,"awaiting_approval");
  const known = new Set(result.citations.map(citation => citation.id));
  const cited = [...result.answer.matchAll(/\[([^\]]+)\]/g)].flatMap(match => match[1].split(/,\s*/));
  assert.ok(cited.length >= 5);
  assert.ok(cited.every(id => known.has(id)));
  assert.equal(result.evaluation.method,"deterministic rule checks");
  assert.equal(result.evaluation.total,5);
  assert.equal(result.evaluation.score,5);
  const approved = await (await request("/api/agent",{caseId:"identity",question:"What happened and what should we do?",approved:true})).json();
  assert.equal(approved.action.status,"executed");
  assert.equal(approved.evaluation.score,5);
  const misrouted = await (await request("/api/agent",{caseId:"identity",question:"cloud credential data exposure"})).json();
  assert.equal(misrouted.evaluation.checks.find(check => check.name === "Procedure matches the incident type").passed,false);
  assert.equal(misrouted.action.status,"blocked");
  const forced = await (await request("/api/agent",{caseId:"identity",question:"cloud credential data exposure",approved:true})).json();
  assert.equal(forced.action.status,"blocked","a failed check must block approval");
  assert.equal((await request("/api/agent",{question:17})).status,400);
  assert.equal((await request("/api/agent",{question:"x".repeat(1001)})).status,400);
  assert.equal((await request("/api/agent",{caseId:"unknown",question:"What happened?"})).status,400);
});
test("Sentinel fits a champion, compares a baseline, and detects drift", async () => {
  const zero = await (await request("/api/monitor",{drift:0,threshold:.58})).json();
  const shifted = await (await request("/api/monitor",{drift:100,threshold:.58})).json();
  assert.equal(zero.metrics.psi,0);
  assert.equal(zero.models.length,2);
  assert.equal(zero.model.type,"L2-regularized logistic regression");
  assert.equal(zero.model.features.length,zero.model.weights.length);
  assert.deepEqual(zero.distribution.reference,zero.distribution.current);
  assert.equal(shifted.distribution.current.reduce((a,b)=>a+b,0),600);
  assert.equal(Object.values(shifted.metrics.confusion).reduce((a,b)=>a+b,0),600);
  assert.ok(shifted.metrics.psi>0);
  const [baseline, champion] = zero.models;
  assert.ok(champion.f1 > baseline.f1 + .1, "champion should clearly beat the baseline");
  assert.ok(champion.f1 < .98 && champion.precision < 1 && champion.recall < 1, "overlapping classes must not score perfectly");
  const lenient = await (await request("/api/monitor",{drift:0,threshold:.35})).json();
  assert.ok(lenient.metrics.recall > zero.metrics.recall && lenient.metrics.precision < zero.metrics.precision);
  assert.ok(shifted.metrics.precision < zero.metrics.precision, "drift toward attack-like traffic should raise false alarms");
  assert.equal((await request("/api/monitor",{drift:"bad"})).status,400);
});
test("Atlas calculates critical paths and remediation impact", async () => {
  const baseline = await (await request("/api/graph",{remediation:"none"})).json();
  const remediated = await (await request("/api/graph",{remediation:"least-privilege"})).json();
  const segmented = await (await request("/api/graph",{remediation:"segment"})).json();
  assert.ok(baseline.summary.paths > 0);
  assert.equal(baseline.summary.eliminated,0);
  assert.ok(remediated.summary.paths < baseline.summary.paths);
  assert.ok(remediated.summary.eliminated > 0);
  assert.ok(segmented.summary.eliminated > 0 && segmented.summary.paths > 0);
  assert.equal(segmented.edges.find(edge => edge.id === "e9").active,false);
  assert.equal((await request("/api/graph",{remediation:"unknown"})).status,400);
});
test("Atlas entity resolution is computed from record fields, not a fixed confidence", async () => {
  const { entityResolution } = await (await request("/api/graph",{remediation:"none"})).json();
  assert.equal("confidence" in entityResolution,false);
  const decisions = Object.fromEntries(entityResolution.candidates.map(candidate => [candidate.source,candidate.decision]));
  assert.deepEqual(decisions,{CMDB:"MATCH","Vulnerability scanner":"REVIEW"});
  for (const candidate of entityResolution.candidates)
    assert.equal(candidate.score,Number(candidate.features.reduce((sum,feature)=>sum+feature.contribution,0).toFixed(3)));
});
test("Hermes fits an email triage model, beats keyword rules, and explains a report", async () => {
  const defaultRun = await (await request("/api/triage", { threshold: .35, sampleId: "lure" })).json();
  const { tp, fp, tn, fn } = defaultRun.metrics.confusion;
  assert.equal(tp + fp + tn + fn, defaultRun.dataset.testRows);
  assert.ok(defaultRun.metrics.f1 > defaultRun.baseline.f1, "fitted model should beat the keyword-rule baseline");
  assert.ok(defaultRun.metrics.recall < 1 && defaultRun.metrics.precision < 1, "overlapping classes must not score perfectly");
  assert.equal(defaultRun.baseline.type, "heuristic");
  const low = await (await request("/api/triage", { threshold: .25, sampleId: "lure" })).json();
  assert.ok(low.metrics.recall > defaultRun.metrics.recall, "lower threshold should raise recall");
  assert.ok(low.metrics.workload > defaultRun.metrics.workload, "lower threshold should raise analyst workload");
  assert.ok(low.metrics.trueNegativeRate < defaultRun.metrics.trueNegativeRate, "lower threshold should lower the true-negative rate");
  const lure = await (await request("/api/triage", { threshold: .35, sampleId: "lure" })).json();
  const notice = await (await request("/api/triage", { threshold: .35, sampleId: "it-reminder" })).json();
  assert.ok(lure.report.probability > notice.report.probability, "credential lure should score above an IT password notice");
  const logit = Number((lure.report.bias + lure.report.contributions.reduce((sum, item) => sum + item.contribution, 0)).toFixed(3));
  assert.equal(lure.report.logit, logit);
  assert.equal((await request("/api/triage", { threshold: "bad" })).status, 400);
  assert.equal((await request("/api/triage", { sampleId: "unknown" })).status, 400);
  assert.equal((await request("/api/triage", { text: "x".repeat(2001) })).status, 400);
  const oversized = await worker.fetch(new Request("http://localhost/api/triage", { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": "9000" }, body: "{}" }), env, ctx);
  assert.equal(oversized.status, 413);
});
test("Prism compares retrievers with deterministic IR metrics and a release gate", async () => {
  const promoted = await (await request("/api/retrieval", { retriever: "hybrid", expansion: true, k: 5, hybridWeight: .5 })).json();
  assert.equal(promoted.gate.verdict, "PROMOTE");
  assert.equal(promoted.gate.method, "deterministic IR metrics");
  const bm25 = await (await request("/api/retrieval", { retriever: "bm25", expansion: false, k: 5 })).json();
  assert.equal(bm25.gate.verdict, "HOLD");
  assert.equal(bm25.candidate.recall, bm25.baseline.recall);
  const ngram = await (await request("/api/retrieval", { retriever: "ngram", expansion: false, k: 5 })).json();
  const typo = ngram.slices.find(slice => slice.slice === "typo");
  assert.ok(typo.candidate > typo.baseline, "n-gram vectors should win the typo slice");
  assert.equal(ngram.gate.verdict, "HOLD");
  const expanded = await (await request("/api/retrieval", { retriever: "hybrid", expansion: true, k: 5, hybridWeight: .5 })).json();
  const plain = await (await request("/api/retrieval", { retriever: "hybrid", expansion: false, k: 5, hybridWeight: .5 })).json();
  const slice = name => expanded.slices.find(item => item.slice === name).candidate - plain.slices.find(item => item.slice === name).candidate;
  assert.ok(slice("acronym") > 0, "expansion should lift the acronym slice");
  assert.ok(slice("paraphrase") > 0, "expansion should lift the paraphrase slice");
  for (const metrics of [promoted.candidate, promoted.baseline]) {
    for (const key of ["recall", "precision", "mrr", "ndcg"]) assert.ok(metrics[key] >= 0 && metrics[key] <= 1, key);
  }
  assert.equal((await request("/api/retrieval", { retriever: "unknown" })).status, 400);
  assert.equal((await request("/api/retrieval", { k: "bad" })).status, 400);
  assert.equal((await request("/api/retrieval", { expansion: "yes" })).status, 400);
});
test("resume is a real PDF and portrait is present", async () => {
  assert.equal((await readFile(new URL("../public/Leonardo-Urena-CV.pdf",import.meta.url))).subarray(0,4).toString(),"%PDF");
  assert.ok((await readFile(new URL("../public/leonardo-urena-portrait.jpg",import.meta.url))).length>1000);
});
