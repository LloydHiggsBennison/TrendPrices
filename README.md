# TrendPrices: Sistema Web de Análisis Matemático de Tendencias de Precios

TrendPrices es una plataforma web completa que permite consultar información histórica de precios de productos utilizando Knasta como fuente principal de datos. A partir de estos datos, la plataforma aplica herramientas matemáticas de cálculo diferencial e integral para analizar tendencias, calcular variaciones, estimar precios promedio, proyectar valores futuros cercanos y entregar recomendaciones de compra inteligentes.

El sistema está diseñado de forma modular, separando la obtención de datos (Knasta), el almacenamiento (Supabase con PostgreSQL) y el análisis matemático.

---

## Requisitos Previos

- **Node.js** (versión 18 o superior)
- **NPM** (incluido con Node.js)
- Un proyecto activo en **Supabase** (para almacenar los datos e historial)

---

## Configuración Inicial Paso a Paso

### 1. Base de Datos (Supabase)

1. Ingresa a [Supabase](https://supabase.com) y crea un nuevo proyecto.
2. Ve a la sección **SQL Editor** en la barra lateral izquierda.
3. Copia el contenido del archivo [schema.sql](file:///e:/Visual%20Studio%20Code/PriceTrend/backend/sql/schema.sql) y ejecútalo en la consola de SQL de Supabase para crear las 5 tablas necesarias:
   - `productos`
   - `tiendas`
   - `historial_precios`
   - `analisis_matematico`
   - `recomendaciones`

### 2. Configurar Variables de Entorno

#### Backend:
1. Abre la carpeta `backend/`.
2. Duplica el archivo `.env.example` y renombralo a `.env`.
3. Edita el archivo `.env` configurando los accesos a tu base de datos de Supabase:
   ```env
   PORT=4000
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   FRONTEND_URL=http://localhost:5173
   ```
   *Nota: Usa la clave `service_role` secreta en el backend para poder realizar operaciones de escritura (upserts/inserts) sin restricciones de RLS.*

#### Frontend:
1. Abre la carpeta `frontend/`.
2. Duplica el archivo `.env.example` y renombralo a `.env`.
3. Asegúrate de tener configurada la URL de la API del backend:
   ```env
   VITE_API_URL=http://localhost:4000/api
   ```

---

## Ejecución Local

Para iniciar el proyecto en tu entorno local, sigue estos comandos:

### 1. Iniciar el Backend

```bash
cd backend
npm install
npm run dev
```
El servidor backend se iniciará en [http://localhost:4000](http://localhost:4000).

### 2. Iniciar el Frontend

En una nueva consola/terminal:

```bash
cd frontend
npm install
npm run dev
```
La aplicación web se iniciará en [http://localhost:5173](http://localhost:5173).

---

## Estructura de Análisis Matemático Aplicado

La plataforma calcula dinámicamente y expone los siguientes conceptos del cálculo y álgebra lineal:

1. **Función de precio lineal**: Modela la tendencia general de los precios mediante regresión lineal por mínimos cuadrados: $P(t) = mt + b$.
2. **Derivada aproximada**: Mide la tasa instantánea de cambio diario: $P'(t) \approx \frac{P(t_2) - P(t_1)}{t_2 - t_1}$. Si es negativa, indica que el precio baja.
3. **Precio promedio (Integral)**: Aproxima la integral definida mediante promedio discreto para obtener la base de comparación histórica del producto: $P_{prom} = \frac{1}{b-a}\int_a^b P(t)dt \approx \frac{1}{n}\sum P_i$.
4. **Límite al infinito**: Calcula el precio asintótico mínimo histórico o soporte inferior: $\lim_{t\to\infty} P(t) = L$.
5. **Proyección a 7 días (Regresión + Estacionalidad + Variables Externas)**: Extiende la tendencia lineal calculando índices estacionales por día de la semana (residuos promedio por día) y ajustando cada uno de los 7 días proyectados con:
   - **Eventos de retail** (CyberDay, CyberMonday, Black Friday, Fiestas Patrias, Navidad, liquidaciones de verano), aplicando el impacto porcentual histórico promedio de cada evento.
   - **Tipo de cambio USD/CLP** (dólar observado, vía [mindicador.cl](https://mindicador.cl)), con un *pass-through* parcial (30%) sobre la proyección.
   - **IPC / Inflación** (vía mindicador.cl), prorrateado diariamente como deriva de fondo sobre el nivel de precios.
   
   Además se calcula un **puntaje de confiabilidad (0-100)** en base a la cantidad de datos históricos disponibles, el ajuste (R²) del modelo de tendencia, y la disponibilidad real (no fallback) de las variables externas.
6. **Matriz Comparativa**: Genera una matriz que sintetiza todos los indicadores y calcula un puntaje ponderado de recomendación de compra para cada tienda.

> **Nota sobre variables externas:** el sistema consulta la API pública gratuita [mindicador.cl](https://mindicador.cl/api) para obtener el dólar observado y el IPC. Si esta API no está disponible, se usan valores de respaldo conservadores y se marca la proyección con menor confiabilidad, mostrando esto explícitamente en el frontend.
