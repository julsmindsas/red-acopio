# Fuentes del scraper — Red de Acopio

> **Regla de honestidad del proyecto:** esta es una app humanitaria real. Una
> dirección o un teléfono equivocados mandan gente a un lugar equivocado. Aquí
> solo se registra lo que aparece en **fuentes públicas reales**, siempre con su
> **URL**. Lo aproximado se marca como aproximado; lo no confirmado queda como
> `sin_verificar`. Nada se inventa.

**Fecha de consulta:** 2026-06-29
**Herramientas usadas:** búsqueda y descarga web (WebSearch / WebFetch) +
geocodificación con Nominatim (OpenStreetMap).
**Resultado:** 9 centros reales curados en `data/scraped/curados.json`, todos en
estado `sin_verificar`. **0 `verificado`** (ver “¿Por qué ninguno es verificado?”).

---

## 1. Contexto

El 24 de junio de 2026, dos terremotos (magnitudes **7,2 Mw** y **7,5 Mw**,
con epicentros cerca de San Felipe / Yumare, estado Yaracuy) golpearon el norte
de Venezuela (La Guaira, Caracas, Valencia, Maracay; estados Yaracuy, Falcón,
Miranda, Carabobo), dejando más de mil muertos, miles de heridos y decenas de
miles de desaparecidos. En Medellín y el Valle de Aburrá surgieron iniciativas
ciudadanas, comerciales y de ONG para recolectar ayuda hacia Venezuela.
Fuente del contexto: Wikipedia — *Terremotos de Venezuela de 2026*
(<https://es.wikipedia.org/wiki/Terremotos_de_Venezuela_de_2026>).

---

## 2. Centros incluidos en `curados.json` (9)

Todos provienen de **medios de prensa** (no de una página oficial de gobierno o
Cruz Roja que los liste), por eso quedan en `sin_verificar`. El teléfono quedó
`null` en todos porque **ninguna fuente publicó un teléfono del punto**.

| # | Centro | Municipio | Fuente | Geocodificación |
|---|--------|-----------|--------|-----------------|
| 1 | Institución Educativa Héctor Abad Gómez (Placita de Flores) — Calle 50 #39-65 | Medellín | El Tiempo (3567045) | Nivel de calle |
| 2 | Grupo Mega — Mall Itagüí, local 146 | Itagüí | El Tiempo (3567045) | Punto exacto (POI: “Mall Itagüí”) |
| 3 | Grupo Mega — Carrera 50 #50-15, sector Parque de Bello | Bello | El Tiempo (3567045) | Nivel de calle |
| 4 | Restaurante Tepuy — Carrera 73C #3-5, Laureles | Medellín | El Tiempo (3567045) | **Aproximada** (no se ubicó la dirección exacta) |
| 5 | Restaurante Tepuy — Transversal 32A Sur #31E-20 | Envigado | El Tiempo (3567045) | Nivel de calle |
| 6 | Semper Café — barrio Belén (sin dirección exacta) | Medellín | El Tiempo (3567045) | **Aproximada** (centroide del barrio) |
| 7 | Simón Coffee — El Poblado (sin dirección exacta) | Medellín | El Tiempo (3567045) | **Aproximada** (centroide del barrio) |
| 8 | Calante Bar — El Poblado (sin dirección exacta) | Medellín | El Tiempo (3567045) | **Aproximada** (centroide del barrio) |
| 9 | Corporación El Minuto de Dios — Carrera 49 #53-19, Of. 403, Ed. Bancoquia | Medellín | Pulzo (PP5230536) | Nivel de calle |

URLs completas:
- El Tiempo (Medellín):
  <https://www.eltiempo.com/colombia/medellin/asi-puede-apoyar-a-las-personas-afectadas-por-los-terremotos-en-venezuela-desde-medellin-donaciones-centros-de-acopio-y-busqueda-de-desaparecidos-3567045>
- Pulzo:
  <https://www.pulzo.com/mundo/como-ayudar-venezuela-puntos-acopio-donaciones-campanas-desde-colombia-PP5230536>

Notas de calidad por centro:
- **Héctor Abad Gómez (1):** El Tiempo lo presenta como el punto de acopio
  dispuesto en Medellín, abierto **todos los días 8:00 a.m.–5:00 p.m. desde el
  26 de junio**. Sin embargo, El Colombiano (26-jun) escribió que “*ningún
  organismo oficial ha anunciado la recepción de ayudas físicas*”. La situación
  evolucionaba día a día: se deja la advertencia en `notes` y el estado en
  `sin_verificar`. **Confirmar vigencia antes de acudir.**
- **Grupo Mega (2, 3):** además de lo mapeado, reciben *alimento para mascotas*
  (mapeado a la categoría `otros`).
- **Tepuy (4, 5):** enfocados en insumos médicos / primeros auxilios. La sede de
  Laureles **no se pudo geocodificar a la dirección exacta** (Nominatim no
  encontró “Carrera 73C #3-5”); el punto es aproximado dentro de Laureles.
- **Semper Café, Simón Coffee, Calante Bar (6, 7, 8):** la fuente da el barrio
  pero **no la dirección exacta**; se usó el **centroide del barrio** (Belén /
  El Poblado). Por eso 7 y 8 comparten coordenadas (ambos en El Poblado).
  **Confirmar la ubicación con cada establecimiento.**
- **El Minuto de Dios (9):** campaña “Un Minuto por los panas”.

---

## 3. Fuentes consultadas que NO aportaron centros (o se descartaron)

| Fuente | URL | Qué se encontró / por qué no se usó |
|--------|-----|--------------------------------------|
| Semana (mapa) | semana.com/.../202616 | Menciona que Cedrizuela tiene punto en Medellín, pero **sin dirección**. No usable. |
| El Espectador | elespectador.com/.../lineas-de-ayuda | Solo cita el **Centro Intégrate** como **atención psicosocial** (no acopio de materiales). Ver conflicto abajo. |
| El Tiempo (organizaciones) | eltiempo.com/.../3567513 | Canales/cuentas (Ábaco, Cruz Roja, El Minuto de Dios, Acnur, Unicef). Sin direcciones físicas de Medellín salvo El Minuto de Dios (ya cubierto por Pulzo). |
| El Colombiano (regional) | elcolombiano.com/.../EI38215908 | Canales económicos (Antioquia Presente, Cruz Roja). Dice que “por el momento ningún organismo oficial ha anunciado recepción de ayudas físicas”. Centro Intégrate = psicosocial (barrio Prado). |
| BluRadio | bluradio.com/.../rg10 | La Alcaldía habilitó **canales de donación económica**, sin puntos físicos con dirección. |
| Gobernación de Antioquia (oficial) | antioquia.gov.co/.../antioquia-se-solidariza | Bomberos de Envigado apoyan rescate. **No lista centros de acopio físicos.** |
| Alcaldía de Medellín (oficial) | medellin.gov.co (varias búsquedas) | **No** se encontró una página oficial que liste un centro de acopio para Venezuela con dirección. (Los resultados eran de reciclaje, lluvias, COVID, etc.) |
| Laika (“Patitas por Venezuela”) | citado en Pulzo / El Tiempo | Recibe en tiendas de Medellín, pero **sin dirección concreta** en las fuentes. No usable. |
| Cedrizuela | citado en Semana | Punto en Medellín **sin dirección**. No usable. |

### Conflicto documentado: “Centro Intégrate” (EXCLUIDO del curado)

Se encontró información **contradictoria** sobre este lugar:
- El Espectador y El Colombiano (regional): **Carrera 49 #58-40, barrio Prado**,
  centro de Medellín, dedicado a **atención psicosocial** (no recibe materiales).
- Un fragmento de resultados de búsqueda atribuía a “Centro Intégrate” otra
  dirección — **barrio Líbano, Carrera 49 #31B-125, detrás de Unitecnar**, 8:00
  a.m.–4:00 p.m. — y sí como punto de recolección de materiales. **No se pudo
  confirmar** esa versión descargando el artículo original.

Por el conflicto de dirección **y** porque las versiones confirmadas lo
describen como apoyo psicosocial (no acopio de materiales), **se excluyó del
`curados.json`**. Incluirlo con una dirección dudosa habría violado la regla de
honestidad. Si alguien confirma la dirección y función reales con una fuente
fiable, puede agregarse como una fuente nueva.

---

## 4. ¿Por qué ninguno es `verificado`?

El criterio del proyecto: un centro es `verificado` **solo si la fuente es
oficial (gobierno / Cruz Roja) y lista explícitamente el centro**. Todas las
fuentes que aportaron centros con dirección son **medios de prensa**. Las fuentes
oficiales consultadas (Alcaldía de Medellín, Gobernación de Antioquia, Cruz Roja)
**no publicaron un listado de puntos físicos con dirección** para esta
emergencia (solo canales de donación económica o labores de rescate). Por lo
tanto, los 9 centros quedan en **`sin_verificar`** y la UI debe mostrar el aviso
“verifica antes de ir”.

---

## 5. Método de geocodificación y limitaciones

- **Proveedor:** Nominatim de OpenStreetMap
  (`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=<dirección>, Medellín, Colombia`),
  consultado el 2026-06-29.
- **Uso responsable:** pocas consultas, con `User-Agent` identificable y un
  máximo de ~1 petición/segundo. Los resultados se guardan en
  `data/scraped/geocode-cache.json` para **no repetir** consultas: el orquestador
  lee el cache primero y solo llama a la red ante una dirección nueva. Por eso el
  scraper es determinístico y puede correr sin internet usando el cache.
- **Precisión (declarada en `notes` de cada centro):**
  - `poi`: punto exacto (ej. “Mall Itagüí”).
  - `calle`: la calle/carrera correcta, pero **no el número de puerta exacto**
    (OSM no siempre tiene numeración en Medellín).
  - `barrio_centroide`: la fuente no dio dirección; se usó el **centroide del
    barrio** (ubicación aproximada).
  - `barrio_aprox`: no se ubicó la dirección exacta; punto **aproximado** dentro
    del barrio (caso Tepuy Laureles).
- **Limitación principal:** varias direcciones quedaron a nivel de calle o de
  barrio, no de puerta. Las coordenadas sirven para **ubicar en el mapa de forma
  orientativa**, no como dirección postal exacta. Siempre prima la dirección en
  texto y la verificación directa.

---

## 6. Cómo correr / actualizar

```bash
npm run scrape   # = tsx scripts/scrape.ts
```

Genera:
- `data/scraped/raw-<fuente>.json` — lo crudo de cada fuente (auditoría).
- `data/scraped/curados.json` — el resultado normalizado (array de `Center`).
- Actualiza `data/scraped/geocode-cache.json` si aparece una dirección nueva.

Para **agregar una fuente**, copia `scripts/sources/_template.ts`, impleméntala
y regístrala en `scripts/sources/index.ts`. Si la fuente publica las direcciones
en prosa (no en una tabla), sigue el patrón de `eltiempo-medellin.ts`: extrae a
mano, deja la `sourceUrl`, y usa el chequeo de frescura. **Nunca** agregues un
centro sin una URL pública real que lo respalde.
