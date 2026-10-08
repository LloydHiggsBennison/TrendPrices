import test from "node:test";
import assert from "node:assert/strict";
import { getAnalysis, runAnalysis } from "../src/services/api.js";
test("frontend refuses unvalidated legacy API results during a partial deployment", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ product: { id: 1 } }),
    });
    await assert.rejects(getAnalysis(1), /versión 2/);
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ analysisVersion: 2, product: { id: 1 } }),
    });
    assert.equal((await getAnalysis(1)).analysisVersion, 2);
  } finally {
    globalThis.fetch = original;
  }
});
test("selected product URL is sent and non JSON backend failures become readable errors", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "http://localhost:4000/api/analysis/run");
      assert.deepEqual(JSON.parse(options.body), {
        query: "Phone",
        productUrl: "https://knasta.cl/detail/test/1/phone",
      });
      return { ok: true, json: async () => ({ analysisVersion: 2 }) };
    };
    await runAnalysis("Phone", "https://knasta.cl/detail/test/1/phone");
    globalThis.fetch = async () => ({
      ok: false,
      json: async () => {
        throw new SyntaxError("HTML response");
      },
    });
    await assert.rejects(getAnalysis(1), /respuesta válida/);
  } finally {
    globalThis.fetch = original;
  }
});
