const test = require("node:test");
const assert = require("node:assert/strict");
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only";
let failing = false;
const ranges = [];
const records = Array.from({ length: 1201 }, (_, id) => ({ id }));
const query = {
  select() {
    return this;
  },
  eq() {
    return this;
  },
  order() {
    return this;
  },
  async range(start, end) {
    ranges.push([start, end]);
    return failing
      ? { error: new Error("Database unavailable") }
      : { data: records.slice(start, end + 1), error: null };
  },
};
require.cache[require.resolve("../src/config/supabaseClient")] = {
  exports: {
    supabase: {
      from() {
        return query;
      },
    },
  },
};
const db = require("../src/services/supabaseService");
test("persistence loads histories beyond Supabase default row limit", async () => {
  const data = await db.getProductHistory(1);
  assert.equal(data.length, 1201);
  assert.deepEqual(ranges, [
    [0, 499],
    [500, 999],
    [1000, 1499],
  ]);
});
test("configured database failures are surfaced, not silently replaced by temporary memory", async () => {
  failing = true;
  await assert.rejects(db.getProductHistory(1), /Database unavailable/);
});
