import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Bookmark,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  ListFilter,
  Search,
  SearchX,
  X,
} from 'lucide-react'
import {
  categoryLabel,
  compareCategories,
  displayId,
  filterStations,
  formatNumber,
  money,
  price,
  type Sort,
  type Station,
} from '../lib/tariffs'
import { Selector } from './Selector'
import { NoSelection, StationDetail } from './StationDetail'
import { TollIcon } from './Brand'

const PAGE_SIZE = 6

type Props = {
  stations: Station[]
  onlySaved: boolean
  savedIds: number[]
  onSave: (s: Station) => void
  onOpen: (s: Station) => void
  onCompare: (s: Station) => void
  onExport: (stations: Station[], category?: string) => void
}

export function Directory({
  stations,
  onlySaved,
  savedIds,
  onOpen,
  onSave,
  onCompare,
  onExport,
}: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<Sort>({ key: 'id', direction: 1 })
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const options = useMemo(() => {
    const counts = new Map<string, number>()
    stations.forEach((s) =>
      s.rates.forEach((r) => counts.set(r.category, (counts.get(r.category) ?? 0) + 1)),
    )
    return [
      { value: '', label: 'Todas las categorías', hint: String(stations.length) },
      ...[...counts.keys()]
        .sort(compareCategories)
        .map((c) => ({ value: c, label: categoryLabel(c), hint: String(counts.get(c)) })),
    ]
  }, [stations])
  const matches = useMemo(
    () => filterStations(stations, query, category, sort),
    [stations, query, category, sort],
  )
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const offset = (currentPage - 1) * PAGE_SIZE
  const visible = matches.slice(offset, offset + PAGE_SIZE)
  const selected = visible.find((s) => s.id === selectedId) ?? visible[0]
  const displayCategory = category || 'I'

  function reset() {
    setQuery('')
    setCategory('')
    setPage(1)
    setSort({ key: 'id', direction: 1 })
    setSelectedId(null)
  }
  function changeSort(key: Sort['key']) {
    setSort((prev) => ({ key, direction: prev.key === key && prev.direction === 1 ? -1 : 1 }))
    setPage(1)
    setSelectedId(null)
  }
  function selectStation(station: Station) {
    setSelectedId(station.id)
    if (window.matchMedia('(max-width: 860px)').matches) onOpen(station)
  }
  function sortHead(key: Sort['key'], label: string) {
    const Icon = sort.key !== key ? ArrowUpDown : sort.direction === 1 ? ArrowUp : ArrowDown
    return (
      <th
        scope="col"
        aria-sort={sort.key !== key ? 'none' : sort.direction === 1 ? 'ascending' : 'descending'}
      >
        <button
          type="button"
          className={sort.key === key ? 'sorted' : ''}
          onClick={() => changeSort(key)}
          aria-label={`Ordenar por ${label.toLowerCase()}`}
        >
          {label}
          <Icon size={11} />
        </button>
      </th>
    )
  }

  if (onlySaved && stations.length === 0)
    return (
      <section className="panel saved-empty">
        <div className="empty-illustration">
          <BookmarkPlus size={30} strokeWidth={1.6} />
        </div>
        <div className="small-kicker">TU COLECCIÓN</div>
        <h2>Aún no tienes peajes guardados</h2>
        <p>
          Usa el marcador de la ficha de una estación para guardarla y volver a consultar sus
          tarifas desde este navegador.
        </p>
        <a href="#explorador" className="button primary">
          Explorar peajes
          <ArrowRight size={15} />
        </a>
      </section>
    )

  return (
    <div className="workspace-grid">
      <section className="panel directory" aria-labelledby="directory-heading">
        <div className="directory-head">
          <div className="directory-title-row">
            <div className="heading-with-count">
              <h2 id="directory-heading">
                {onlySaved ? 'Mis estaciones' : 'Directorio de peajes'}
              </h2>
              <span className="count-badge">{formatNumber(matches.length)}</span>
            </div>
            <button
              type="button"
              className="export-button"
              disabled={!matches.length}
              onClick={() => onExport(matches, category)}
              title="Descargar los registros de la consulta en CSV"
            >
              <Download size={15} />
              Exportar
            </button>
          </div>
          <p>
            {onlySaved
              ? 'Peajes que guardaste en este navegador.'
              : 'Selecciona una estación para ver el detalle de sus tarifas.'}
          </p>
          <div className="search-toolbar">
            <div className="search-field">
              <Search size={17} />
              <input
                type="search"
                value={query}
                aria-label="Buscar peaje por nombre o ID"
                placeholder="Buscar peaje por nombre o ID…"
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                  setSelectedId(null)
                }}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Borrar búsqueda"
                  onClick={() => {
                    setQuery('')
                    setPage(1)
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Selector
              icon={<ListFilter size={16} />}
              label="Filtrar por categoría"
              placeholder="Buscar categoría…"
              value={category}
              buttonText={category ? categoryLabel(category) : 'Categorías'}
              options={options}
              onChange={(v) => {
                setCategory(v)
                setPage(1)
                setSelectedId(null)
              }}
            />
          </div>
        </div>
        <table className="directory-table">
          <caption className="sr-only">
            Peajes encontrados y tarifa en pesos colombianos para la categoría {displayCategory}.
          </caption>
          <thead>
            <tr>
              {sortHead('name', 'Estación de peaje')}
              {sortHead('count', 'Categorías')}
              {sortHead('price', `Tarifa cat. ${displayCategory}`)}
              <th scope="col">
                <span className="sr-only">Detalle</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => {
              const val = price(s, displayCategory),
                active = s.id === selected?.id
              return (
                <tr
                  key={s.id}
                  className={`station-row ${active ? 'selected' : ''}`}
                  onClick={() => selectStation(s)}
                >
                  <th scope="row">
                    <button
                      type="button"
                      className="station-hit"
                      aria-label={`Consultar ${s.name}`}
                      aria-pressed={active}
                      onClick={(e) => {
                        e.stopPropagation()
                        selectStation(s)
                      }}
                    >
                      <span className="station-symbol">
                        <TollIcon size={19} />
                      </span>
                      <span className="station-identity">
                        <span className="station-name">
                          {s.name}
                          {savedIds.includes(s.id) && (
                            <Bookmark
                              size={11}
                              className="inline-bookmark"
                              fill="currentColor"
                              aria-label="Guardado"
                            />
                          )}
                        </span>
                        <small>ID {displayId(s.id)}</small>
                      </span>
                    </button>
                  </th>
                  <td className="count-cell">
                    <span>{s.rates.length}</span>
                  </td>
                  <td className="price-cell">
                    {val !== undefined ? (
                      money(val)
                    ) : (
                      <span
                        title={`Sin registro para ${categoryLabel(displayCategory).toLowerCase()}`}
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td className="chevron-cell">
                    <ChevronRight size={15} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!matches.length && (
          <div className="no-results">
            <span className="empty-illustration small">
              <SearchX size={24} />
            </span>
            <h3>No encontramos peajes</h3>
            <p>Prueba con otro nombre, ID o categoría.</p>
            <button type="button" className="button secondary" onClick={reset}>
              Limpiar filtros
            </button>
          </div>
        )}
        <div className="pagination">
          <span aria-live="polite">
            {matches.length ? (
              <>
                <strong>
                  {offset + 1}–{offset + visible.length}
                </strong>{' '}
                de {formatNumber(matches.length)} {matches.length === 1 ? 'estación' : 'estaciones'}
              </>
            ) : (
              '0 estaciones'
            )}
          </span>
          <nav aria-label="Páginas del directorio">
            <button
              type="button"
              className="page-arrow"
              disabled={currentPage === 1}
              aria-label="Página anterior"
              onClick={() => {
                setPage(currentPage - 1)
                setSelectedId(null)
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="page-index">
              {currentPage} <i>/</i> {pages}
            </span>
            <button
              type="button"
              className="page-arrow"
              disabled={currentPage === pages}
              aria-label="Página siguiente"
              onClick={() => {
                setPage(currentPage + 1)
                setSelectedId(null)
              }}
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      </section>
      {selected ? (
        <StationDetail
          station={selected}
          saved={savedIds.includes(selected.id)}
          onSave={() => onSave(selected)}
          category={category}
          onOpen={() => onOpen(selected)}
          onCompare={() => onCompare(selected)}
        />
      ) : (
        <NoSelection />
      )}
    </div>
  )
}
