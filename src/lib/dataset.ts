import csv from '../data/Tarifas_de_Peajes_ANI_20261118.csv?raw'
import sourceUrl from '../data/Tarifas_de_Peajes_ANI_20261118.csv?url'
import { parseDataset } from './tariffs'

export const dataset = parseDataset(csv)
export const snapshotDate = '2026-11-18'
export const sourceFile = 'Tarifas_de_Peajes_ANI_20261118.csv'
export { sourceUrl }

export function downloadFile(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
