function normalizePrice(value) {
  if (typeof value === "number")
    return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  if (typeof value !== "string" || value.includes("-")) return 0;
  let text = value.trim().replace(/\$/g, "").replace(/\s/g, "");
  if (!/^[0-9]+(?:[.,][0-9]+)*$/.test(text)) return 0;
  const decimal = text.match(/[.,]([0-9]{1,2})$/);
  if (decimal) {
    const integer = text.slice(0, decimal.index).replace(/[.,]/g, "");
    text = `${integer}.${decimal[1]}`;
  } else text = text.replace(/[.,]/g, "");
  const number = Number(text);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}
module.exports = normalizePrice;
