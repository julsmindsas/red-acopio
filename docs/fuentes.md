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

## Puntos para mascotas/animales

> Esta sección documenta la investigación específica de **puntos donde donar
> insumos para mascotas y animales** afectados por los terremotos de Venezuela
> (junio de 2026). Los resultados se guardan en
> `data/scraped/curados-mascotas.json`.
>
> **Fecha de consulta:** 2026-06-30.
> **Herramientas usadas:** WebSearch + WebFetch + Nominatim (OSM).

### Qué se buscó

Términos de búsqueda utilizados:

- `"Laika tienda mascotas centro de acopio Venezuela Medellín 2026"`
- `"Una garra por Venezuela" Laika Medellin punto acopio dirección mascotas junio 2026`
- `"Laika 'Patitas por Venezuela' tienda Medellín dirección horario 2026"`
- `"fundación animalista Medellín acopio mascotas Venezuela terremoto 2026 donaciones"`

### Fuentes consultadas

| Fuente | URL | Hallazgo |
|--------|-----|----------|
| **Pulzo** (primaria) | [pulzo.com/.../PP5230073](https://www.pulzo.com/mundo/laika-habilito-puntos-acopio-para-ayudar-mascotas-terremoto-venezuela-PP5230073) | Campaña "Patitas por Venezuela" de Laika; menciona Arkadia (Cra 70 #1-141 local 9822) y El Poblado (Cl. 2 Sur #32-54) como puntos en Medellín. |
| **Infobae** (confirmación) | [infobae.com/.../colombia/2026/06/27](https://www.infobae.com/colombia/2026/06/27/asi-puede-ayudar-a-los-animales-afectados-por-el-terremoto-en-venezuela-bogota-abrio-puntos-de-donacion/) | Confirma los tres puntos Laika en Medellín: Arkadia, El Poblado y Llanogrande (Km 7 vía Llanogrande, Rionegro). |
| **El Tiempo** (contenido comercial) | [eltiempo.com/.../3534207](https://www.eltiempo.com/contenido-comercial/laika-entregara-4-toneladas-de-alimento-y-activa-centros-de-acopio-en-medellin-y-barranquilla-3534207) | Artículo sobre emergencia de Córdoba (feb 2026), no Venezuela, pero confirma las mismas tres direcciones Laika en Medellín. Se usa solo como verificación de dirección, no como fuente principal. |
| **El Tiempo** (Medellín, ya en fuentes) | [eltiempo.com/.../3567045](https://www.eltiempo.com/colombia/medellin/asi-puede-apoyar-a-las-personas-afectadas-por-los-terremotos-en-venezuela-desde-medellin-donaciones-centros-de-acopio-y-busqueda-de-desaparecidos-3567045) | Menciona Grupo Mega (Itagüí y Bello) con "alimento para mascotas" entre los materiales. Ya cubierto en `curados.json`; aquí se reclasifica con la categoría correcta `mascotas`. |
| **Nación Paisa** | [nacionpaisa.com/.../una-garra-por-venezuela](https://www.nacionpaisa.com/una-garra-por-venezuela-abre-acopio-en-laika-para-enviar-seis-toneladas-de-ayuda/) | Campaña "Una Garra por Venezuela" (Fundación Ruta Animal + Laika + Misión Kiara + Avianca). Los 7 puntos de acopio son **todos en Bogotá** (no Medellín). Se descarta para este dataset. |
| **RCN Radio** | [newsroom.rcnradio.com/.../donaciones-para-animales](https://newsroom.rcnradio.com/colombia/donaciones-para-animales-afectados-por-el-terremoto-en-venezuela-asi-puedes-ayudar-a-las-mascotas-damnificadas) | Repite los puntos de Bogotá y Cundinamarca de "Una Garra por Venezuela". Sin direcciones de Medellín. Descartado. |
| **Minuto60** | [minuto60.com/.../11175](https://www.minuto60.com/colombia/una-garra-venezuela-iniciativa-que-busca-ayudar-animales/11175) | Describe "Una Garra por Venezuela" con 7 puntos Laika, todos en Bogotá. Sin Medellín. Descartado. |
| **Semana** (mapa) | semana.com/.../202616 | Cita puntos en Bogotá/Medellín/Cali/Pereira sin direcciones específicas. No usable. |
| **Pulzo** (general) | [pulzo.com/.../PP5230536](https://www.pulzo.com/mundo/como-ayudar-venezuela-puntos-acopio-donaciones-campanas-desde-colombia-PP5230536) | Menciona "Patitas por Venezuela" en Medellín pero **sin direcciones concretas** (ya cubiertas por la fuente primaria). |

### Puntos encontrados

Se encontraron **5 puntos reales** que explícitamente aceptan insumos para mascotas en el Área Metropolitana de Medellín / Oriente Antioqueño:

| # | Nombre | Municipio | Dirección | Fuente | Geocodificación |
|---|--------|-----------|-----------|--------|-----------------|
| 1 | Laika Mascotas — Arkadia | Medellín | Cra 70 #1-141, local 9822 | Pulzo PP5230073 | POI exacto del C.C. Arkadia |
| 2 | Laika Mascotas — El Poblado | Medellín | Cl. 2 Sur #32-54 | Pulzo PP5230073 | Nivel de calle |
| 3 | Laika Mascotas — Llanogrande | Rionegro | Vía Llanogrande-Ríogrande, Km 7 | Infobae 27-jun-2026 | **APROXIMADA** al corregimiento Llanogrande |
| 4 | Grupo Mega — Mall Itagüí | Itagüí | Mall Itagüí, local 146 | El Tiempo 3567045 | POI del Mall Itagüí |
| 5 | Grupo Mega — Bello | Bello | Cra 50 #50-15, Parque de Bello | El Tiempo 3567045 | Nivel de calle |

**Importante sobre el punto 3 (Llanogrande):** Nominatim no pudo geocodificar
"Km 7 vía Llanogrande" de forma precisa. Se usó el centroide del corregimiento
de Llanogrande (Rionegro) como aproximación; el km exacto no está en OSM.
Confirmar la ubicación de entrada antes de acudir.

**Sobre los puntos 4 y 5:** ya existen en `curados.json` con categoría `otros`
para mascotas. En `curados-mascotas.json` se reclasifican con la categoría
correcta `mascotas` y se añade el campo `city` explícito.

### Organizaciones de mascotas adicionales consultadas

- **Fundación Ruta Animal** (fundacionrutanimal.org): su campaña "Una Garra por
  Venezuela" operó en Bogotá/Cundinamarca, no en Medellín. No se encontró
  punto físico de esta organización en el Área Metropolitana.
- **Misión Kiara**: participa en "Una Garra por Venezuela" con puntos solo en
  Bogotá.
- **Fundación GORA** (aliada de Laika en el despacho de alimentos): no se
  encontró un punto físico de acopio propio en Medellín.
- **Instituto de Protección Animal** (Bogotá): organismo distrital de Bogotá,
  sin sede en Medellín.
- **Fundaciones animalistas de Medellín / Antioquia en general**: no se
  encontró ninguna fundación animalista de Medellín o Antioquia que haya
  publicado un punto de acopio físico con dirección para la emergencia Venezuela
  2026 durante la búsqueda del 2026-06-30. Si existe, no está indexada en
  medios masivos.

### Limitaciones y advertencias

1. **Vigencia temporal:** la campaña "Patitas por Venezuela" de Laika tenía
   una ventana publicada del 25 al 30 de junio de 2026. A partir del 30 de
   junio, verificar con Laika si los puntos siguen activos.
2. **Sin teléfono:** ninguna fuente publicó un número de teléfono de contacto
   para estos puntos.
3. **Sin horario exacto:** las fuentes solo indican el rango de fechas, no el
   horario de apertura/cierre de cada tienda.
4. **Geocodificación:** Laika Llanogrande es APROXIMADA (centroide del
   corregimiento). Los puntos de Grupo Mega son de nivel calle/POI.
5. **Real vs. verificado:** todos los centros provienen de medios de prensa,
   no de Laika directamente ni de un organismo oficial. Quedan `sin_verificar`.

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
