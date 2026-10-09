# TrendPrices

Análisis de precios publicados por Knasta con selección del producto exacto, historial validado, regresión lineal, promedio ponderado por tiempo y proyección a siete días.

## Ejecutar localmente

Requiere Node.js 22.12 o superior (verificado con 22.20). En dos terminales:

```sh
cd backend
npm ci
npm start
```

```sh
cd frontend
npm ci
npm run dev
```

El frontend usa `http://localhost:4000/api` por defecto. Copia los archivos `.env.example` a `.env` si necesitas otra configuración.

Para almacenamiento persistente, configura `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` **solo en el backend**. Ambas variables deben configurarse juntas. Sin ellas se utiliza memoria temporal y la interfaz lo indica: los enlaces dejan de funcionar al reiniciar el servidor. Cuando Supabase está configurado, un fallo de base de datos se informa como error y nunca se reemplaza silenciosamente por memoria.

Las tablas requeridas se describen en [backend/sql/schema.sql](backend/sql/schema.sql). Ese archivo original comienza con `DROP TABLE`: no debe ejecutarse sobre una base con datos. Las migraciones incrementales de `supabase/migrations` restauran los permisos mínimos de `service_role` y añaden tres columnas de proyección que faltaban en la base desplegada, sin borrar registros. Deben ejecutarse como propietario de la base, en orden, después de revisar el SQL; no ejecutar `db push` sin reconciliar primero el historial de migraciones de la base existente.

## Uso y datos

1. Busca un producto.
2. Selecciona la publicación exacta revisando modelo, capacidad, color y condición.
3. Se comparan como máximo cinco tiendas con el mismo nombre completo normalizado. Este criterio conservador puede excluir publicaciones equivalentes con nombres diferentes; no se infiere equivalencia por palabras parciales.
4. La API vuelve a validar la selección contra Knasta. No acepta URLs arbitrarias para extraer información.
5. Fechas inválidas y precios ausentes, no finitos o no positivos se descartan. Las observaciones repetidas del mismo día se actualizan.
6. Si falla el historial, se conserva lo validado y el precio de búsqueda solo cuando tiene fecha de origen. No se crean historiales aleatorios.

El precio es el publicado por Knasta (`current_price`). Puede estar sujeto a tarjeta o condiciones de la tienda. El precio de referencia proviene del precio internet o de la última variación publicada; no equivale necesariamente a un precio normal de venta. La reducción porcentual se calcula contra esa referencia. Una publicación no confirma stock en la tienda.

Los registros nuevos usan `fuente = 'Knasta:v2'`. Los análisis excluyen registros de versiones anteriores, porque esas versiones podían mezclar productos o guardar precios ficticios. Un enlace antiguo sin datos validados invita a analizar el producto otra vez; no se borra el historial anterior.

## Cálculos

- **Regresión lineal:** mínimos cuadrados centrados, `P(t) = mt + b`, con `t` en días desde la primera observación válida. Se conserva la precisión completa para calcular; se redondea al presentar. La API incluye pendiente, intercepto, R², tamaño de muestra y puntos ajustados.
- **Gráfico:** observaciones y regresión comparten un eje numérico con las fechas reales. La recta discontinua se puede ocultar. Los intervalos irregulares mantienen su duración y las líneas no usan suavizado que pueda inventar máximos o mínimos.
- **Variación reciente:** tasa media entre la observación más reciente y la primera de las últimas diez observaciones. No es una derivada instantánea de una función continua conocida.
- **Promedio temporal:** integral por trapecios dividida por la duración del historial. Con una única observación se muestra ese precio.
- **Mínimo observado:** mínimo del período validado. No es un límite al infinito ni una garantía del precio futuro.
- **Proyección:** siete fechas desde la última observación, con al menos tres fechas válidas y un período mínimo de siete días. La estacionalidad se aplica solo con cuatro observaciones de cada día de la semana. Se omiten extrapolaciones que generen precios no positivos.
- **Índice de calidad:** hasta 40 puntos por tamaño de muestra y 40 por R² (máximo actual 80/100). Es una heurística descriptiva, no una probabilidad de acierto. R² describe el ajuste histórico, no el desempeño futuro.
- **Indicadores económicos:** dólar e IPC de mindicador.cl se muestran con sus fechas y como contexto; no alteran la predicción sin una relación estadística validada. La variación del dólar usa días de calendario y el IPC de doce meses usa capitalización compuesta con meses consecutivos. La falta de datos produce valores no disponibles, no números inventados.
- **Eventos comerciales:** no se aplican descuentos automáticos basados en fechas recurrentes aproximadas ni impactos genéricos sin evidencia del producto.
- **Recomendación:** ponderación heurística de precio, historial, tendencia, promedio, proyección y publicación. Los datos antiguos o escasos se indican expresamente. Solo se usa una proyección para sugerir esperar o comprar pronto cuando el índice es al menos 50 y R² al menos 0,5; estos umbrales no representan validación predictiva.

## Pruebas

```sh
cd backend
npm test
```

```sh
cd frontend
npm test
npm run lint
npm run build
```

Las 29 pruebas cubren fórmulas conocidas, fechas irregulares, datos inválidos, selección de variantes, flujo POST/GET, repetición sin duplicados, fallos de fuente, paginación de más de 1000 registros, errores de persistencia, indicadores económicos y compatibilidad de la API. Las pruebas usan memoria o dobles de servicios y no escriben en una base real.

## Despliegue

Frontend y backend deben actualizarse conjuntamente. `POST /api/analysis/run` requiere `{ query, productUrl }`; los resultados validados llevan `analysisVersion: 2`. El frontend rechaza resultados de la API anterior para evitar mostrar análisis no validados durante un despliegue parcial.

- Render: directorio raíz `backend`, instalar con `npm ci`, iniciar con `npm start`, configurar las dos variables de Supabase para persistencia.
- Vercel: directorio raíz `frontend`, compilar con `npm run build`, directorio de salida `dist`, configurar `VITE_API_URL` con la URL real del backend.
- `frontend/vercel.json` reescribe `/analysis/:path*` a `index.html`, para abrir o recargar los enlaces sin 404.
- Después de desplegar: probar búsqueda, selección, resultado, actualización y recarga directa del enlace; confirmar que `persistence` sea `supabase` y que el historial permanezca después de reiniciar el backend.

La verificación local con datos reales incluyó iPhone 15, Adidas Samba y PlayStation 5. Todos los precios retornados coincidieron con Knasta, y pendiente, promedio, mínimos y resultados POST/GET se comprobaron independientemente. La interfaz se revisó en escritorio y móvil de 390 × 844.

Calendario Cyber: la CCS confirmó CyberMonday 2026 del 5 al 7 de octubre, hasta las 23:59 hora de Chile. Se muestra el estado vigente/próximo/finalizado y la fecha oficial de cierre. Las extensiones por tienda requieren comprobar sus condiciones. La rebaja se mide contra el último precio observado dentro de los 30 días anteriores al evento; no se inventan descuentos. Durante un Cyber activo, una rebaja observada cerca del mínimo histórico se destaca como oportunidad y no recibe una segunda reducción artificial. Fuente: https://www.ccs.cl/ecommerce/cybermonday-2026/ .
