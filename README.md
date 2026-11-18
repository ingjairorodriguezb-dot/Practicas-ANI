# VíaAtlas · Explorador de peajes de la ANI

Aplicación interactiva en español para consultar el archivo `Tarifas_de_Peajes_ANI_20261118.csv` de Colombia. Incluye los **1.228 registros**, **129 estaciones** y **47 categorías** del archivo adjunto. No requiere una cuenta, un servidor de datos ni claves de API.

## Uso

- **Explorador:** busca un peaje por nombre (con o sin tildes) o ID. El filtro de categoría restringe las estaciones y actualiza la columna de precio. Puedes ordenar la tabla por estación, cantidad de categorías o tarifa.
- **Ficha de estación:** selecciona una fila para ver sus tarifas. El botón de detalle abre la lista completa con la fecha de cada registro. En pantallas pequeñas la fila abre la ficha directamente.
- **Comparador:** elige dos estaciones y consulta la diferencia de precio para cada categoría, o muestra solo las categorías que ambas tienen.
- **Guardados:** marca estaciones desde su ficha. Se conservan en el almacenamiento local de tu navegador.
- **Exportación:** «Exportar» descarga todas las filas de la consulta (no solo la página visible); en una ficha descarga las tarifas de esa estación. «Acerca de los datos» ofrece además el archivo original intacto.

## Ejecutar

Requisito: Node.js 22.18 o posterior.

```sh
npm ci
npm run dev
```

El servidor de desarrollo expone la aplicación en el puerto indicado por Vite. Para verificar el modelo de datos y compilar la aplicación:

```sh
npm test
npm run build
npm run preview
```

`dist/` es un sitio estático que se puede publicar en la raíz de un servidor web. Las secciones usan navegación por fragmento. Tanto las fuentes tipográficas como la ilustración se sirven con la aplicación.

## Interpretación del archivo

- El original está en `src/data/`. Se analiza como CSV UTF-8 con BOM y campos entre comillas. En `Valor`, la coma separa miles: `"16,500"` equivale a **16.500 COP**.
- Las estaciones se agrupan por `IdPeaje`; se conservan los códigos de `IdCategoriaTarifa`, incluidas las categorías especiales. No se infieren ubicaciones ni clases de vehículo.
- El directorio usa la categoría **I** como referencia cuando no hay un filtro. Un guion indica una categoría sin registro, no una tarifa de cero pesos.
- Los indicadores resumen **todo el archivo**. El promedio es la media de `Valor` de los 1.228 registros, incluidos los valores cero, redondeada para mostrar pesos enteros.
- El **18 de noviembre de 2026** corresponde al corte identificado en el nombre del archivo. La fecha de cada tarifa procede de `UltimoFechaCambioPeaje`; en la cabecera de la estación se muestra la más reciente de sus registros. No hay actualización en tiempo real.

## Estructura

Interfaz en React y TypeScript con Vite. `src/lib/tariffs.ts` contiene el análisis, los filtros, el ordenamiento, la comparación y la exportación. Las pruebas en `tests/` contrastan esas operaciones con el CSV suministrado. La ilustración de la portada es decorativa, no un mapa de las estaciones.
