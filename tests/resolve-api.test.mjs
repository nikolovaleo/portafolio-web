import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

test("entity resolution reports an explainable threshold gap", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/api/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        left: {
          hostname: "SRV-WEB-008",
          ip: "10.8.2.14",
          owner: "Web Platform",
          os: "Ubuntu 24.04",
          deviceId: "S-008",
        },
        right: {
          hostname: "HR-LT-221",
          ip: "10.33.9.80",
          owner: "Casey Morgan",
          os: "Windows 11",
          deviceId: "L-221",
        },
        threshold: 0.72,
      }),
    }),
    {},
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.decision, "NO_MATCH");
  assert.equal(result.threshold, 0.72);
  assert.equal(result.thresholdGap, Number((result.score - result.threshold).toFixed(3)));
  assert.ok(result.thresholdGap < 0);
  assert.equal("confidence" in result, false);
});
