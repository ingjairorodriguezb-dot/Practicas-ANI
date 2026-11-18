import {
  ArrowLeftRight,
  ArrowRight,
  Bookmark,
  CalendarDays,
  Download,
  MapPin,
  MousePointer2,
} from 'lucide-react'
import { categoryLabel, displayId, money, shortDate, type Station } from '../lib/tariffs'
import { Modal } from './Modal'

type Props = { station: Station; saved: boolean; onSave: () => void }
function SaveButton({ saved, onSave, station }: Props) {
  const label = `${saved ? 'Quitar de guardados' : 'Guardar peaje'}: ${station.name}`
  return (
    <button
      type="button"
      className={`icon-button save-button ${saved ? 'is-saved' : ''}`}
      aria-label={label}
      title={label}
      aria-pressed={saved}
      onClick={onSave}
    >
      <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}
function StationMeta({ station }: { station: Station }) {
  return (
    <div className="station-meta">
      <span className="id-badge">ID {displayId(station.id)}</span>
      <span className="meta-divider" />
      <span>
        <CalendarDays size={13} />
        <time dateTime={station.latestDate}>Último cambio: {shortDate(station.latestDate)}</time>
      </span>
    </div>
  )
}

export function StationDetail({
  station,
  saved,
  onSave,
  category,
  onOpen,
  onCompare,
}: Props & { category: string; onOpen: () => void; onCompare: () => void }) {
  const first = station.rates.slice(0, 5)
  const chosen = station.rates.find((r) => r.category === category)
  const preview = chosen && !first.includes(chosen) ? [...first.slice(0, 4), chosen] : first
  const max = Math.max(...station.rates.map((r) => r.value), 1)
  return (
    <aside className="panel detail-panel" aria-label={`Detalle de ${station.name}`}>
      <div className="detail-head">
        <div className="detail-kicker">
          <MapPin size={13} />
          ESTACIÓN SELECCIONADA
        </div>
        <SaveButton station={station} saved={saved} onSave={onSave} />
        <h2>{station.name}</h2>
        <StationMeta station={station} />
      </div>
      <div className="detail-body">
        <div className="detail-section-title">
          <h3>Tarifas por categoría</h3>
          <span className="currency-badge">COP</span>
        </div>
        <div className="rate-preview" aria-label="Vista previa de tarifas">
          {preview.map((r) => (
            <div
              key={r.category}
              className={`chart-row ${category === r.category ? 'chosen-category' : ''}`}
            >
              <span>{categoryLabel(r.category)}</span>
              <div className="bar-track" aria-hidden="true">
                <i style={{ width: `${(r.value / max) * 100}%` }} />
              </div>
              <strong>{money(r.value)}</strong>
            </div>
          ))}
        </div>
        <button className="all-rates" onClick={onOpen}>
          {station.rates.length === 1
            ? 'Ver tarifa completa'
            : `Ver las ${station.rates.length} tarifas`}
          <ArrowRight size={15} />
        </button>
      </div>
      <div className="detail-foot">
        <button type="button" onClick={onCompare}>
          <ArrowLeftRight size={15} />
          Comparar estación
        </button>
      </div>
    </aside>
  )
}

export function NoSelection() {
  return (
    <aside className="panel no-selection">
      <MousePointer2 size={24} />
      <h3>Detalle de estación</h3>
      <p>Las tarifas aparecerán aquí cuando selecciones un peaje.</p>
    </aside>
  )
}

export function RatesModal({
  station,
  saved,
  onSave,
  close,
  onCompare,
  onExport,
}: Props & { close: () => void; onCompare: () => void; onExport: () => void }) {
  return (
    <Modal labelledBy="rates-title" close={close} className="rates-modal">
      <div className="modal-banner">
        <div className="detail-kicker">
          <MapPin size={13} />
          FICHA DE ESTACIÓN
        </div>
        <h2 id="rates-title">{station.name}</h2>
        <StationMeta station={station} />
      </div>
      <div className="modal-section-heading">
        <div>
          <h3>Tarifas por categoría</h3>
          <p>
            {station.rates.length} {station.rates.length === 1 ? 'registro' : 'registros'} · Valores
            en pesos colombianos
          </p>
        </div>
        <SaveButton station={station} saved={saved} onSave={onSave} />
      </div>
      <div className="rates-scroll">
        <table className="rate-table">
          <thead>
            <tr>
              <th scope="col">Categoría</th>
              <th scope="col">Último cambio</th>
              <th scope="col">Tarifa (COP)</th>
            </tr>
          </thead>
          <tbody>
            {station.rates.map((r) => (
              <tr key={r.category}>
                <th scope="row">
                  <span className="cat-pill">{r.category}</span>
                </th>
                <td>{shortDate(r.date)}</td>
                <td>{money(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="modal-actions">
        <button className="button secondary" onClick={onExport}>
          <Download size={15} />
          Exportar CSV
        </button>
        <button className="button primary" onClick={onCompare}>
          <ArrowLeftRight size={15} />
          Comparar estación
        </button>
      </div>
    </Modal>
  )
}
