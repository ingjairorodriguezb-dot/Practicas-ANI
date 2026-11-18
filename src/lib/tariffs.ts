import Papa from 'papaparse'

export type Rate = { category: string; value: number; date: string; sourceDate: string }
export type Station = {
  id: number
  name: string
  sourceName: string
  latestDate: string
  rates: Rate[]
}
export type Sort = { key: 'id' | 'name' | 'count' | 'price'; direction: 1 | -1 }
export type Dataset = { stations: Station[]; categories: string[]; count: number; average: number }

type SourceRow = {
  IdPeaje: string
  Peaje: string
  UltimoFechaCambioPeaje: string
  IdCategoriaTarifa: string
  Valor: string
}
const fields: (keyof SourceRow)[] = [
  'IdPeaje',
  'Peaje',
  'UltimoFechaCambioPeaje',
  'IdCategoriaTarifa',
  'Valor',
]
const sourceMonths = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')
const months = 'ene feb mar abr may jun jul ago sep oct nov dic'.split(' ')
const standardCategories = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
const collator = new Intl.Collator('es-CO', { numeric: true, sensitivity: 'base' })
const numberFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0, useGrouping: true })
export const formatNumber = (n: number) => numberFormat.format(n)
export const money = (n: number) => `$ ${formatNumber(n)}`
export const displayId = (id: number) => String(id).padStart(3, '0')
export const normalize = (s: string) =>
  s
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
export const price = (s: Station, category: string) =>
  s.rates.find((r) => r.category === category)?.value
export const categoryLabel = (code: string) =>
  code === 'UNICA' ? 'Categoría única' : `Categoría ${code}`
export function shortDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`
}

export function compareCategories(a: string, b: string) {
  const rank = (x: string) =>
    standardCategories.includes(x) ? standardCategories.indexOf(x) : standardCategories.length
  return rank(a) - rank(b) || collator.compare(a, b)
}

function stationName(name: string) {
  return name
    .split(/\s+/)
    .map((w, i) => {
      if (standardCategories.includes(w) || ['CIAT', 'CENCAR', 'ETD'].includes(w)) return w
      const lower = w.toLocaleLowerCase('es-CO')
      if (i && ['de', 'del', 'la', 'los', 'las'].includes(lower)) return lower
      return lower.charAt(0).toLocaleUpperCase('es-CO') + lower.slice(1)
    })
    .join(' ')
}

export function parseDataset(csv: string): Dataset {
  const parsed = Papa.parse<SourceRow>(csv.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
  })
  if (
    parsed.errors.length ||
    !fields.every((k) => parsed.meta.fields?.includes(k)) ||
    !parsed.data.length
  ) {
    throw new Error('El archivo no tiene la estructura esperada de tarifas ANI.')
  }
  const byId = new Map<number, Station>()
  const categories = new Set<string>()
  let total = 0
  for (const row of parsed.data) {
    const id = Number(row.IdPeaje)
    const [year, month, day] = row.UltimoFechaCambioPeaje.split(' ')
    const monthIndex = sourceMonths.indexOf(month)
    const value = Number(row.Valor.replaceAll(',', ''))
    if (
      !Number.isInteger(id) ||
      !row.Peaje ||
      !row.IdCategoriaTarifa ||
      !row.Valor ||
      !Number.isFinite(value) ||
      monthIndex < 0 ||
      !/^\d{4}$/.test(year) ||
      !/^\d{1,2}$/.test(day)
    ) {
      throw new Error('El archivo contiene una tarifa no válida.')
    }
    const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day.padStart(2, '0')}`
    const station = byId.get(id) ?? {
      id,
      name: stationName(row.Peaje),
      sourceName: row.Peaje,
      latestDate: date,
      rates: [] as Rate[],
    }
    station.rates.push({
      category: row.IdCategoriaTarifa,
      value,
      date,
      sourceDate: row.UltimoFechaCambioPeaje,
    })
    if (date > station.latestDate) station.latestDate = date
    byId.set(id, station)
    categories.add(row.IdCategoriaTarifa)
    total += value
  }
  const stations = [...byId.values()].sort((a, b) => a.id - b.id)
  stations.forEach((s) => s.rates.sort((a, b) => compareCategories(a.category, b.category)))
  return {
    stations,
    categories: [...categories].sort(compareCategories),
    count: parsed.data.length,
    average: total / parsed.data.length,
  }
}

export function filterStations(
  stations: Station[],
  query: string,
  category: string,
  sort: Sort,
): Station[] {
  const search = normalize(query)
  const idMatch = /^(?:id\s*|#)?0*(\d+)$/.exec(search)
  return stations
    .filter(
      (s) =>
        (!search || (idMatch ? s.id === Number(idMatch[1]) : normalize(s.name).includes(search))) &&
        (!category || price(s, category) !== undefined),
    )
    .sort((a, b) => {
      let diff = 0
      if (sort.key === 'name') diff = collator.compare(a.name, b.name)
      if (sort.key === 'count') diff = a.rates.length - b.rates.length
      if (sort.key === 'id') diff = a.id - b.id
      if (sort.key === 'price') {
        const pa = price(a, category || 'I'),
          pb = price(b, category || 'I')
        // A missing record is not a zero-peso tariff. Keep it last in either direction.
        if (pa === undefined || pb === undefined)
          return pa === pb ? a.id - b.id : pa === undefined ? 1 : -1
        diff = pa - pb
      }
      return sort.direction * diff || a.id - b.id
    })
}

export function comparison(a: Station, b: Station) {
  return [...new Set([...a.rates, ...b.rates].map((r) => r.category))]
    .sort(compareCategories)
    .map((category) => {
      const left = price(a, category),
        right = price(b, category)
      return {
        category,
        left,
        right,
        difference: left !== undefined && right !== undefined ? right - left : undefined,
      }
    })
}

// Match the provided file's schema, BOM, and quoted thousands-separated amounts.
export function exportCsv(stations: Station[], category = '') {
  const rows = stations.flatMap((s) =>
    s.rates
      .filter((r) => !category || r.category === category)
      .map((r) => [
        String(s.id),
        s.sourceName,
        r.sourceDate,
        r.category,
        r.value.toLocaleString('en-US'),
      ]),
  )
  return {
    text: '\uFEFF' + Papa.unparse({ fields, data: rows }, { quotes: true, newline: '\r\n' }),
    count: rows.length,
  }
}
