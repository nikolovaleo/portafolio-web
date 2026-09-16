import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import worker from "../dist/server/index.js";
const env = { ASSETS: { fetch: async () => new Response("Not found",{status:404}) } };
const ctx = {waitUntil(){},passThroughOnException(){}};
const request = (path, body) => worker.fetch(new Request("http://localhost"+path,body === undefined ? {} : {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),env,ctx);
test("homepage and three project routes render distinct content", async () => {
  for (const [path, expected] of [["/","One system. Three layers of proof."],["/projects/atlas","Atlas Graph"],["/projects/sentinel","Sentinel ModelOps"],["/projects/aegis","Aegis Investigator"]]) {
    const result = await request(path);
    assert.equal(result.status,200,path);
    const html = await result.text();
    assert.ok(html.includes(expected),path);
    assert.ok(!html.includes(">ONLINE<"),path);
    assert.ok(html.includes("/Leonardo-Urena-CV.pdf"));
  }
  assert.equal((await request("/projects/missing")).status,404);
});
test("homepage establishes AI and data science expertise with evidence", async () => {
  const html = await (await request("/")).text();
  for (const expected of ["AI &amp; Data Science","Agentic AI","RAG systems","200K+","Weeks → minutes","Data foundation","Generative AI","Evaluation","Production","89.93%"])
    assert.ok(html.includes(expected),expected);
});
test("Aegis executes typed tools, cites evidence, and gates action", async () => {
  const result = await (await request("/api/agent",{caseId:"identity",question:"What happened and what should we do?"})).json();
  assert.equal(result.toolCalls.length,4);
  assert.equal(result.action.status,"awaiting_approval");
  assert.ok(result.answer.includes("[T1–T4]"));
  assert.equal(result.evaluation.total,5);
  const approved = await (await request("/api/agent",{caseId:"identity",question:"What happened and what should we do?",approved:true})).json();
  assert.equal(approved.action.status,"executed");
  assert.equal((await request("/api/agent",{question:17})).status,400);
  assert.equal((await request("/api/agent",{question:"x".repeat(1001)})).status,400);
});
test("Sentinel fits a champion, compares a baseline, and detects drift", async () => {
  const zero = await (await request("/api/monitor",{drift:0,threshold:.58})).json();
  const shifted = await (await request("/api/monitor",{drift:100,threshold:.58})).json();
  assert.equal(zero.metrics.psi,0);
  assert.equal(zero.models.length,2);
  assert.equal(zero.model.type,"L2-regularized logistic regression");
  assert.equal(Object.values(shifted.metrics.confusion).reduce((a,b)=>a+b,0),600);
  assert.ok(shifted.metrics.psi>0);
  assert.equal((await request("/api/monitor",{drift:"bad"})).status,400);
});
test("Atlas calculates critical paths and remediation impact", async () => {
  const baseline = await (await request("/api/graph",{remediation:"none"})).json();
  const remediated = await (await request("/api/graph",{remediation:"least-privilege"})).json();
  assert.ok(baseline.summary.paths > 0);
  assert.ok(remediated.summary.paths < baseline.summary.paths);
  assert.ok(remediated.summary.eliminated > 0);
  assert.equal((await request("/api/graph",{remediation:"unknown"})).status,400);
});
test("resume is a real PDF and portrait is present", async () => {
  assert.equal((await readFile(new URL("../public/Leonardo-Urena-CV.pdf",import.meta.url))).subarray(0,4).toString(),"%PDF");
  assert.ok((await readFile(new URL("../public/leonardo-urena-portrait.jpg",import.meta.url))).length>1000);
});
