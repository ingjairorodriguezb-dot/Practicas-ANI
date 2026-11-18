import { useMemo, useState } from 'react'
import { ArrowLeftRight, Check, Equal, Info, MapPin, Minus } from 'lucide-react'
import { dataset } from '../lib/dataset'
import {
  categoryLabel,
  comparison,
  displayId,
  money,
  shortDate,
  type Station,
} from '../lib/tariffs'
import { Selector } from './Selector'

type Props = { left: Station; right: Station; setPair: (left: number, right: number) => void }
const ordered = dataset.stations.slice().sort((a, b) => a.name.localeCompare(b.name, 'es-CO'))
const option = (s: Station) => ({
  label: s.name,
  value: String(s.id),
  hint: `ID ${displayId(s.id)}`,
  keywords: `ID ${displayId(s.id)} ${s.id}`,
})

export function Compare({ left, right, setPair }: Props) {
  const [onlyCommon, setCommon] = useState(false)
  const all = useMemo(() => comparison(left, right), [left, right])
  const rows = onlyCommon ? all.filter((r) => r.difference !== undefined) : all
  const commonCount = all.filter((r) => r.difference !== undefined).length
  return (
    <section className="panel comparison" aria-labelledby="compare-heading">
      <div className="compare-intro">
        <div className="small-kicker">
          <ArrowLeftRight size={13} />
          ANÁLISIS DE TARIFAS
        </div>
        <h2 id="compare-heading">Comparación entre estaciones</h2>
        <p>Elige dos peajes para comparar sus tarifas categoría por categoría.</p>
      </div>
      <div className="compare-pair">
        <div className="compare-choice">
          <span className="choice-label">
            <span>A</span>Primera estación
          </span>
          <Selector
            icon={<MapPin size={16} />}
            label="Primera estación"
            placeholder="Buscar primera estación…"
            value={String(left.id)}
            options={ordered.filter((s) => s.id !== right.id).map(option)}
            onChange={(v) => setPair(Number(v), right.id)}
          />
          <small>Último cambio: {shortDate(left.latestDate)}</small>
        </div>
        <button
          className="icon-button swap"
          title="Intercambiar estaciones"
          aria-label="Intercambiar estaciones"
          onClick={() => setPair(right.id, left.id)}
        >
          <ArrowLeftRight size={17} />
        </button>
        <div className="compare-choice second">
          <span className="choice-label">
            <span>B</span>Segunda estación
          </span>
          <Selector
            icon={<MapPin size={16} />}
            label="Segunda estación"
            placeholder="Buscar segunda estación…"
            value={String(right.id)}
            options={ordered.filter((s) => s.id !== left.id).map(option)}
            onChange={(v) => setPair(left.id, Number(v))}
          />
          <small>Último cambio: {shortDate(right.latestDate)}</small>
        </div>
      </div>
      <div className="compare-table-title">
        <div className="heading-with-count">
          <h3>Detalle por categoría</h3>
          <span className="count-badge">{rows.length}</span>
        </div>
        <label className="common-switch">
          <input
            type="checkbox"
            checked={onlyCommon}
            onChange={(e) => setCommon(e.target.checked)}
          />
          <span className="switch-track" />
          Solo en común ({commonCount})
        </label>
      </div>
      <div className="compare-table-scroll">
        <table className="compare-table">
          <caption className="sr-only">
            Diferencias entre las tarifas de {left.name} y {right.name}, en pesos colombianos.
          </caption>
          <thead>
            <tr>
              <th scope="col">Categoría</th>
              <th scope="col">
                <span>A</span> {left.name}
              </th>
              <th scope="col">
                <span>B</span> {right.name}
              </th>
              <th scope="col">Diferencia (B − A)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.category}>
                <th scope="row">{categoryLabel(r.category)}</th>
                <td>{r.left !== undefined ? money(r.left) : <span className="missing">—</span>}</td>
                <td>
                  {r.right !== undefined ? money(r.right) : <span className="missing">—</span>}
                </td>
                <td>
                  {r.difference === undefined ? (
                    <span className="difference no-value">
                      <Minus size={12} />
                      Sin comparación
                    </span>
                  ) : r.difference === 0 ? (
                    <span className="difference same">
                      <Equal size={12} />
                      Iguales
                    </span>
                  ) : (
                    <span className={`difference ${r.difference < 0 ? 'lower' : 'higher'}`}>
                      {r.difference < 0 ? '−' : '+'}
                      {money(Math.abs(r.difference))}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="no-results">
          <h3>No hay categorías en común</h3>
          <p>Desactiva el filtro para ver todas las tarifas de estas dos estaciones.</p>
          <button className="button secondary" onClick={() => setCommon(false)}>
            <Check size={14} />
            Mostrar todas
          </button>
        </div>
      )}
      <div className="compare-note">
        <Info size={15} />
        <span>
          Valores en COP. La diferencia es la tarifa de B menos la de A. Un guion indica que no hay
          registro para esa categoría.
        </span>
      </div>
    </section>
  )
}
