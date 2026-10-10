import { useEffect, useState } from "react";
import { getRetailEvent } from "../services/api";
export default function CyberBanner() {
  const [event, setEvent] = useState(null);
  useEffect(() => {
    let mounted = true;
    const update = async () => {
      try {
        const data = await getRetailEvent();
        if (mounted) setEvent(data.event);
      } catch {
        if (mounted) setEvent(null);
      }
    };
    update();
    const timer = setInterval(update, 60000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);
  if (!event) return null;
  if (event.status === "ended")
    return (
      <aside
        className="rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3 mb-6"
        aria-label="Calendario oficial del Cyber"
      >
        <details>
          <summary className="cursor-pointer text-sm text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400">
            <span className="font-semibold text-slate-200">{event.nombre}</span>
            <span className="ml-2 text-xs text-slate-400">
              Finalizado · Ver fechas y condiciones
            </span>
          </summary>
          <p className="text-sm text-slate-300 mt-3">
            Finalizó el {event.endLabel}.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Las promociones extendidas dependen de cada tienda. Confirma su
            fecha de término en las condiciones de la oferta.
          </p>
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-indigo-300 underline mt-3"
          >
            Consultar fechas oficiales en la CCS
          </a>
        </details>
      </aside>
    );
  return (
    <aside
      className="glass-card rounded-2xl p-5 mb-6 border border-amber-500/30"
      aria-label="Calendario oficial del Cyber"
    >
      <h2 className="text-lg font-bold text-amber-300">
        {event.nombre} ·{" "}
        {event.status === "active"
          ? "En curso"
          : event.status === "upcoming"
            ? "Próximamente"
            : "Evento oficial finalizado"}
      </h2>
      <p className="text-sm text-slate-200 mt-2">
        {event.status === "ended" ? "Finalizó el " : "Disponible hasta el "}
        {event.endLabel}.
      </p>
      <p className="text-xs text-slate-400 mt-2">
        {event.status === "active"
          ? "Las rebajas se comprueban con el historial de cada producto. Una oferta puede terminar antes o agotar su stock."
          : event.status === "ended"
            ? "Las promociones extendidas dependen de cada tienda. Su fecha de término debe confirmarse en las condiciones de la oferta."
            : "Comienza el 5 de octubre. El calendario no garantiza descuentos en todos los productos."}
      </p>
      <a
        href={event.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-xs text-indigo-300 underline mt-3"
      >
        Consultar fechas oficiales en la CCS
      </a>
    </aside>
  );
}
