import {
  ArrowLeftRight,
  Bookmark,
  CalendarDays,
  Coins,
  Compass,
  Database,
  Info,
  Layers3,
  Tickets,
} from 'lucide-react'
import { dataset, snapshotDate } from '../lib/dataset'
import { formatNumber, money, shortDate } from '../lib/tariffs'
import { Brand, TollIcon } from './Brand'

export type View = 'explorador' | 'comparador' | 'guardados'
export const viewCopy = {
  explorador: {
    title: 'Explorador de peajes',
    description: 'Consulta y compara las tarifas de la red de peajes de Colombia.',
  },
  comparador: {
    title: 'Comparador de peajes',
    description: 'Contrasta dos estaciones y descubre la diferencia entre sus tarifas.',
  },
  guardados: {
    title: 'Peajes guardados',
    description: 'Tus estaciones de interés, reunidas en un solo lugar.',
  },
}

export function Header({
  view,
  savedCount,
  about,
}: {
  view: View
  savedCount: number
  about: () => void
}) {
  const nav = [
    { key: 'explorador', label: 'Explorador', Icon: Compass },
    { key: 'comparador', label: 'Comparador', Icon: ArrowLeftRight },
    { key: 'guardados', label: 'Guardados', Icon: Bookmark },
  ]
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="#explorador" className="brand-link" aria-label="VíaAtlas, ir al explorador">
          <Brand />
        </a>
        <nav className="primary-nav" aria-label="Navegación principal">
          {nav.map(({ key, label, Icon }) => (
            <a
              key={key}
              href={`#${key}`}
              className={`nav-link ${view === key ? 'active' : ''}`}
              aria-current={view === key ? 'page' : undefined}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
              {key === 'guardados' && savedCount > 0 && (
                <span className="saved-counter">{savedCount}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="header-end">
          <span className="country">
            <span className="flag" aria-hidden="true" />
            Colombia
          </span>
          <span className="header-divider" />
          <button
            type="button"
            onClick={about}
            className="info-button"
            aria-label="Acerca de los datos"
            title="Acerca de los datos"
          >
            <Info size={19} />
          </button>
        </div>
      </div>
    </header>
  )
}

export function Hero({ view }: { view: View }) {
  return (
    <section className="hero" aria-labelledby="page-heading">
      <div className="hero-art" aria-hidden="true" />
      <div className="hero-content">
        <div className="hero-kicker">
          <span />
          OBSERVATORIO VIAL
        </div>
        <h1 id="page-heading">{viewCopy[view].title}</h1>
        <p>{viewCopy[view].description}</p>
        <div className="hero-meta">
          <span>
            <Database size={13} />
            Datos ANI
          </span>
          <i />
          <span>
            <CalendarDays size={13} />
            Corte: {shortDate(snapshotDate)}
          </span>
        </div>
      </div>
    </section>
  )
}

export function Metrics() {
  const cards = [
    {
      label: 'Estaciones de peaje',
      value: formatNumber(dataset.stations.length),
      icon: <TollIcon size={24} />,
      tone: 'green',
    },
    {
      label: 'Tarifas registradas',
      value: formatNumber(dataset.count),
      icon: <Tickets size={23} />,
      tone: 'blue',
    },
    {
      label: 'Categorías tarifarias',
      value: formatNumber(dataset.categories.length),
      icon: <Layers3 size={24} />,
      tone: 'violet',
    },
    {
      label: 'Tarifa promedio',
      value: money(dataset.average),
      icon: <Coins size={24} />,
      tone: 'amber',
      unit: 'COP',
    },
  ]
  return (
    <section className="metrics" aria-label="Resumen del archivo ANI completo">
      {cards.map((c) => (
        <div className="metric" key={c.label}>
          <div className={`metric-icon ${c.tone}`}>{c.icon}</div>
          <div className="metric-data">
            <div className="metric-label">{c.label}</div>
            <p className="metric-value">
              {c.value}
              {c.unit && <small> {c.unit}</small>}
            </p>
          </div>
        </div>
      ))}
    </section>
  )
}

export function Footer({ about }: { about: () => void }) {
  return (
    <footer className="footer">
      <div>
        <span className="footer-dot" />
        Fuente: Agencia Nacional de Infraestructura (ANI)
      </div>
      <button onClick={about}>
        <Info size={14} />
        Acerca de los datos
      </button>
    </footer>
  )
}
