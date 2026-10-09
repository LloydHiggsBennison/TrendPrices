import formatCurrency from "../utils/formatCurrency";
import formatDate from "../utils/formatDate";
export default function AnalysisNotices({ data }) {
  return (
    <div className="space-y-2 text-sm text-amber-300" role="status">
      <p className="text-xs text-slate-400">
        El índice de compra es una ponderación heurística, no una probabilidad.
        Precios publicados por Knasta. Revisa en la tienda las condiciones de
        tarjeta, despacho y disponibilidad.
      </p>
      {data.stores?.map((store) => {
        const comparison = store.eventPriceComparison;
        if (!comparison) return null;
        return (
          <p
            key={store.storeId}
            className="p-3 rounded-xl bg-indigo-500/10 text-slate-200"
          >
            <strong>{store.storeName}: </strong>
            {comparison.status === "insufficient" ? (
              "No hay un precio observado en los 30 días previos al Cyber para verificar una rebaja."
            ) : (
              <>
                {comparison.status === "lower"
                  ? `Precio observado ${comparison.reductionPercent.toFixed(1)}% menor`
                  : comparison.status === "higher"
                    ? `Precio observado ${Math.abs(comparison.reductionPercent).toFixed(1)}% mayor`
                    : "Precio observado sin cambio"}{" "}
                frente a {formatCurrency(comparison.baselinePrice)} del{" "}
                {formatDate(comparison.baselineDate)}, antes del Cyber. Precio
                comparado del {formatDate(comparison.currentDate)}.
                {comparison.status === "lower" &&
                  " La rebaja ya está reflejada en el precio publicado; confirma su vigencia y condiciones en la tienda."}
              </>
            )}
          </p>
        );
      })}
      {data.persistence === "memory" && (
        <p className="p-3 rounded-xl bg-amber-500/10">
          Almacenamiento temporal: el enlace de análisis puede dejar de
          funcionar al reiniciar el servidor.
        </p>
      )}
      {data.stores?.length === 1 && (
        <p className="p-3 rounded-xl bg-slate-800/60 text-slate-300">
          Se encontró una tienda para esta variante exacta. La recomendación
          evalúa su historial; no compara otras capacidades, colores o
          condiciones.
        </p>
      )}
      {data.warnings?.map((message, i) => (
        <p key={i} className="p-3 rounded-xl bg-amber-500/10">
          {message}
        </p>
      ))}
      {data.stores?.some((s) => s.insufficientHistory) && (
        <p className="p-3 rounded-xl bg-amber-500/10">
          Historial insuficiente en alguna tienda: se muestran los datos
          observados y se omiten las proyecciones sin respaldo.
        </p>
      )}
    </div>
  );
}
