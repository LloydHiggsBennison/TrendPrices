import { useState } from "react";
import {
  ArrowRight,
  ImageOff,
  Search,
  SlidersHorizontal,
  Store,
  AlertCircle,
} from "lucide-react";
import formatCurrency from "../utils/formatCurrency";
import formatDate from "../utils/formatDate";

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false);
  const validImage =
    typeof product.image === "string" && /^https?:\/\//i.test(product.image);
  return (
    <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl bg-white flex items-center justify-center overflow-hidden">
      {validImage && !failed ? (
        <img
          src={product.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-contain p-2"
        />
      ) : (
        <ImageOff
          className="text-slate-400"
          size={30}
          aria-label="Imagen no disponible"
        />
      )}
    </div>
  );
}

export default function ProductResults({
  products,
  query,
  searchInfo,
  isLoading,
  onSelect,
  onSearch,
}) {
  const [store, setStore] = useState("all");
  const [sort, setSort] = useState("relevance");
  const stores = [
    ...new Map(
      products.map((p) => [p.retail, p.retailLabel || p.retail]),
    ).entries(),
  ];
  const visible = products.filter((p) => store === "all" || p.retail === store);
  if (sort !== "relevance")
    visible.sort((a, b) =>
      sort === "low"
        ? a.currentPrice - b.currentPrice
        : b.currentPrice - a.currentPrice,
    );

  return (
    <section className="mb-8" aria-labelledby="product-results-title">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-2">
            Resultados de búsqueda
          </p>
          <h2
            id="product-results-title"
            className="text-2xl sm:text-3xl font-bold text-slate-100"
          >
            Encuentra el producto que buscas
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Resultados para{" "}
            <span className="font-semibold text-slate-200">“{query}”</span>.
            Revisa modelo, capacidad, color y condición antes de analizar.
          </p>
        </div>
        <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-xs text-indigo-200">
          {products.length} publicaciones · {stores.length} tiendas
        </span>
      </div>
      {searchInfo?.corrected && (
        <div
          className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 mb-5 flex gap-3"
          role="status"
        >
          <AlertCircle size={20} className="text-amber-300 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-200">
              Knasta cambió la búsqueda a “{searchInfo.sourceQuery}”.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Se excluyen publicaciones cuyos números de modelo o capacidad no
              coinciden con tu búsqueda.
            </p>
            <button
              disabled={isLoading}
              onClick={() => onSearch(searchInfo.sourceQuery)}
              className="text-sm text-indigo-300 underline underline-offset-4 mt-2 disabled:opacity-50"
            >
              Buscar “{searchInfo.sourceQuery}”
            </button>
          </div>
        </div>
      )}
      {products.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-700/60 bg-slate-800/50 p-3 mb-5">
          <SlidersHorizontal
            size={18}
            className="text-slate-400 self-center hidden sm:block"
          />
          <label className="flex-1 min-w-36 text-xs text-slate-400">
            Tienda
            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="block w-full mt-1 rounded-lg border border-slate-600 bg-slate-900 text-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-indigo-400"
              disabled={isLoading}
            >
              <option value="all">Todas las tiendas</option>
              {stores.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 min-w-36 text-xs text-slate-400">
            Ordenar por
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="block w-full mt-1 rounded-lg border border-slate-600 bg-slate-900 text-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-indigo-400"
              disabled={isLoading}
            >
              <option value="relevance">Coincidencia con la búsqueda</option>
              <option value="low">Menor precio primero</option>
              <option value="high">Mayor precio primero</option>
            </select>
          </label>
          <span
            className="text-xs text-slate-400 self-center sm:ml-auto"
            aria-live="polite"
          >
            {visible.length} de {products.length} resultados
          </span>
        </div>
      )}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
          <Search size={28} className="mx-auto text-slate-500 mb-3" />
          <h3 className="text-lg font-semibold text-slate-200">
            No hay publicaciones coincidentes
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            Prueba otra búsqueda o selecciona otra tienda. No sustituimos el
            modelo que pediste por uno diferente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((product) => (
            <article
              key={product.id}
              className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col"
            >
              <div className="flex gap-4 items-start">
                <ProductImage product={product} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-indigo-200 flex items-center gap-1.5 mb-2">
                    <Store size={13} aria-hidden="true" />
                    {product.retailLabel || product.retail}
                  </p>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-100 leading-snug break-words">
                    {product.name}
                  </h3>
                  {product.brand && (
                    <p className="text-xs text-slate-400 mt-1">
                      {product.brand}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-2 mt-5 pt-4 border-t border-slate-700/60">
                <div>
                  <p className="text-xs text-slate-400 mb-1">
                    Precio publicado
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-slate-100">
                    {formatCurrency(product.currentPrice)}
                  </p>
                </div>
                {product.discount > 0 &&
                  product.normalPrice > product.currentPrice && (
                    <div className="text-right">
                      <span className="inline-block rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                        −{product.discount}% vs. referencia
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        Referencia: {formatCurrency(product.normalPrice)}
                      </p>
                    </div>
                  )}
              </div>
              <p className="text-xs text-slate-500 mt-2 mb-4">
                {product.currentDate
                  ? `Fecha del precio: ${formatDate(product.currentDate)}`
                  : "Fecha del precio no informada"}
              </p>
              <button
                disabled={isLoading}
                onClick={() => onSelect(product)}
                className="mt-auto w-full rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-3 text-sm font-semibold text-indigo-200 flex items-center justify-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 disabled:opacity-50"
                aria-label={`Analizar ${product.name} en ${product.retailLabel || product.retail}`}
              >
                Ver historial y analizar{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      )}
      {products.length > 0 && (
        <p className="text-xs text-slate-500 mt-4">
          Precios publicados por Knasta. Pueden requerir tarjeta u otras
          condiciones. El análisis compara publicaciones con el mismo nombre
          completo.
        </p>
      )}
    </section>
  );
}
