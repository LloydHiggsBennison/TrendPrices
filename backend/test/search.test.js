const { test } = require("node:test");
const assert = require("node:assert/strict");
const { filterSearchResults } = require("../src/utils/searchRelevance");
test("search API exposes the corrected source query even when initialData retains the original", async () => {
  const axios = require("axios");
  const originalGet = axios.get;
  const data = {
    query: { q: "rtx 3060", corrected_from: "rtx 4060" },
    props: {
      pageProps: {
        initialData: {
          q: "rtx 4060",
          products: [
            {
              title: "Tarjeta RTX 3060",
              retail: "test",
              product_id: "1",
              current_price: 100,
            },
          ],
        },
      },
    },
  };
  axios.get = async () => ({
    data: `<script id="__NEXT_DATA__">${JSON.stringify(data)}</script>`,
  });
  try {
    const result = await require("../src/services/knastaService").searchProduct(
      "rtx 4060",
      { includeMetadata: true },
    );
    assert.equal(result.searchInfo.sourceQuery, "rtx 3060");
    assert.equal(result.searchInfo.corrected, true);
    assert.equal(result.searchInfo.excludedCount, 1);
    assert.deepEqual(result.products, []);
  } finally {
    axios.get = originalGet;
  }
});
test("a corrected search cannot substitute RTX 3060 for RTX 4060", () => {
  const products = [
    "RTX 3060 12GB",
    "GeForce RTX4060 8GB",
    "RTX 40600",
    "PC RTX 4060 Ti",
  ].map((name) => ({ name }));
  assert.deepEqual(
    filterSearchResults(products, "rtx 4060").map((p) => p.name),
    ["GeForce RTX4060 8GB", "PC RTX 4060 Ti"],
  );
});
test("capacity identifiers remain exact while words rank stable source results", () => {
  const products = ["Phone 256GB", "Other 128 GB", "iPhone 15 128GB"].map(
    (name) => ({ name }),
  );
  assert.deepEqual(
    filterSearchResults(products, "iPhone 15 128gb").map((p) => p.name),
    ["iPhone 15 128GB"],
  );
  assert.equal(
    filterSearchResults(
      [{ name: "Otro" }, { name: "Zapatillas Adidas Samba" }],
      "adidas samba",
    )[0].name,
    "Zapatillas Adidas Samba",
  );
});
