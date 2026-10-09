const colors = ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b"];
export function buildHistoryDatasets(
  history,
  results = [],
  showRegression = true,
) {
  const groups = new Map();
  for (const item of history || []) {
    const store = item.tiendas?.nombre || "Tienda";
    const date = String(item.fecha_registro || "").slice(0, 10);
    const timestamp = Date.parse(`${date}T00:00:00Z`);
    const price = Number(item.precio_actual);
    if (!Number.isFinite(timestamp) || !Number.isFinite(price) || price <= 0)
      continue;
    if (!groups.has(store)) groups.set(store, new Map());
    groups.get(store).set(timestamp, price);
  }
  return [...groups.entries()].flatMap(([store, points], index) => {
    const color = colors[index % colors.length];
    const historical = {
      label: `${store} · observado`,
      data: [...points.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([x, y]) => ({ x, y })),
      borderColor: color,
      backgroundColor: color,
      fill: false,
      tension: 0,
      pointRadius: 2,
      pointHoverRadius: 5,
    };
    const fit = results.find((r) => r.storeName === store)?.regression;
    if (!showRegression || !fit?.valid) return [historical];
    return [
      historical,
      {
        label: `${store} · regresión lineal`,
        data: fit.fittedPoints.map((p) => ({
          x: Date.parse(`${p.date}T00:00:00Z`),
          y: p.price,
        })),
        borderColor: color,
        borderDash: [8, 5],
        pointRadius: 0,
        fill: false,
        tension: 0,
      },
    ];
  });
}
