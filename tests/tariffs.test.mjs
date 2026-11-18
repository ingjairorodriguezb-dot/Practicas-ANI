import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  categoryLabel,
  comparison,
  exportCsv,
  filterStations,
  money,
  parseDataset,
  price,
  shortDate,
} from '../src/lib/tariffs.ts'

const source = readFileSync(
  new URL('../src/data/Tarifas_de_Peajes_ANI_20261118.csv', import.meta.url),
  'utf8',
)
const { stations, categories, count, average } = parseDataset(source)
const [alvarado, chicoral] = stations
const byId = { key: 'id', direction: 1 }

test('agrupa todos los registros reales, sin perder tarifas especiales ni valores cero', () => {
  assert.equal(stations.length, 129)
  assert.equal(count, 1228)
  assert.equal(categories.length, 47)
  assert.equal(
    stations.reduce((n, s) => n + s.rates.length, 0),
    count,
  )
  assert.equal(stations.flatMap((s) => s.rates).filter((r) => r.value === 0).length, 20)
  assert.equal(average, 37303421 / 1228)
  assert.equal(money(average), '$ 30.377')
  assert.equal(price(alvarado, 'I'), 16500)
  assert.deepEqual(categories.slice(0, 9), ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'])
})

test('mantiene la fecha por tarifa y toma como fecha de estación la más reciente', () => {
  const s = stations.find((s) => s.name === 'Boquerón I')
  assert.equal(s.latestDate, '2026-01-16')
  assert.equal(shortDate(s.latestDate), '16 ene 2026')
  assert.deepEqual([...new Set(s.rates.map((r) => r.date))].sort(), [
    '2024-11-16',
    '2025-11-16',
    '2026-01-16',
  ])
})

test('busca por nombre sin tildes o por ID, incluidos ceros iniciales', () => {
  assert.deepEqual(
    filterStations(stations, '  BOQUERON  ', '', byId).map((s) => s.name),
    ['Boquerón I', 'Boquerón II'],
  )
  for (const q of ['#001', 'ID 001', '001', '1'])
    assert.deepEqual(filterStations(stations, q, '', byId), [alvarado])
  assert.deepEqual(filterStations(stations, 'zzzzz', '', byId), [])
  assert.deepEqual(filterStations(stations, 'Honda', 'IX', byId), [])
})

test('aplica el filtro a las estaciones con un registro en la categoría elegida', () => {
  assert.equal(filterStations(stations, '', 'I', byId).length, 127)
  assert.deepEqual(
    filterStations(stations, '', 'UNICA', byId).map((s) => s.name),
    ['Ancón Sur'],
  )
  assert.equal(categoryLabel('UNICA'), 'Categoría única')
  assert.equal(
    price(
      stations.find((s) => s.name === 'Unisabana'),
      'I',
    ),
    undefined,
  )
  assert.equal(
    price(
      stations.find((s) => s.name === 'ETD 10+850'),
      'I',
    ),
    0,
  )
})

test('ordena sin mutar los datos y deja las tarifas ausentes al final en ambos sentidos', () => {
  for (const direction of [1, -1]) {
    const sorted = filterStations(stations, '', '', { key: 'price', direction })
    assert.equal(price(sorted.at(-1), 'I'), undefined)
    const prices = sorted.map((s) => price(s, 'I')).filter((n) => n !== undefined)
    assert.deepEqual(
      prices,
      [...prices].sort((a, b) => direction * (a - b)),
    )
  }
  assert.equal(stations[0].name, 'Alvarado')
})

test('compara la unión de categorías sin convertir registros ausentes a cero', () => {
  const ab = comparison(alvarado, chicoral)
  assert.equal(ab.length, 13)
  assert.equal(ab.filter((r) => r.difference !== undefined).length, 7)
  assert.equal(ab.find((r) => r.category === 'I').difference, 100)
  assert.equal(comparison(chicoral, alvarado).find((r) => r.category === 'I').difference, -100)
  assert.equal(ab.find((r) => r.category === 'IE').difference, undefined)
  const zero = stations.find((s) => s.name === 'ETD 10+850')
  assert.equal(comparison(zero, alvarado)[0].difference, 16500)
})

test('exporta solo las filas de la consulta en un CSV que se puede volver a leer', () => {
  const result = exportCsv(filterStations(stations, 'boqueron', 'I', byId), 'I')
  assert.equal(result.count, 2)
  assert.ok(result.text.startsWith('\uFEFF'))
  const restored = parseDataset(result.text)
  assert.deepEqual(
    restored.stations.map((s) => s.name),
    ['Boquerón I', 'Boquerón II'],
  )
  assert.deepEqual(restored.categories, ['I'])
  assert.equal(restored.average, 20800)
  const full = parseDataset(exportCsv(stations).text)
  assert.deepEqual(full.stations, stations)
})

test('rechaza datos sin las columnas o los importes esperados', () => {
  assert.throws(() => parseDataset('Peaje,Valor\nX,1'))
  assert.throws(() => parseDataset(source.replace('16,500', 'sin valor')))
})
