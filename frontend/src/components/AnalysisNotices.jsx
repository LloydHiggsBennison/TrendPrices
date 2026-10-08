export default function AnalysisNotices({ data }) {
  return <div className="space-y-2 text-sm text-amber-300" role="status">
    <p className="text-xs text-slate-400">El índice de compra es una ponderación heurística, no una probabilidad. Precios publicados por Knasta. Revisa en la tienda las condiciones de tarjeta, despacho y disponibilidad.</p>
    {data.persistence === 'memory' && <p className="p-3 rounded-xl bg-amber-500/10">Almacenamiento temporal: el enlace de análisis puede dejar de funcionar al reiniciar el servidor.</p>}
    {data.stores?.length === 1 && <p className="p-3 rounded-xl bg-slate-800/60 text-slate-300">Se encontró una tienda para esta variante exacta. La recomendación evalúa su historial; no compara otras capacidades, colores o condiciones.</p>}
    {data.warnings?.map((message, i) => <p key={i} className="p-3 rounded-xl bg-amber-500/10">{message}</p>)}
    {data.stores?.some(s => s.insufficientHistory) && <p className="p-3 rounded-xl bg-amber-500/10">Historial insuficiente en alguna tienda: se muestran los datos observados y se omiten las proyecciones sin respaldo.</p>}
  </div>;
}
