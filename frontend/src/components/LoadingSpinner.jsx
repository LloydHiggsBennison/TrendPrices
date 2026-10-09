import { Loader2 } from "lucide-react";
export default function LoadingSpinner({ message }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
      <h3 className="text-xl font-bold text-slate-200 mb-2">
        {message || "Consultando datos de Knasta..."}
      </h3>
      <p className="text-sm text-slate-400">
        La consulta puede tardar mientras responde la fuente de datos.
      </p>
    </div>
  );
}
