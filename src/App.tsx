import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { Header, Hero, Metrics, Footer, viewCopy, type View } from './components/Layout'
import { Directory } from './components/Directory'
import { RatesModal } from './components/StationDetail'
import { About } from './components/About'
import { Compare } from './components/Compare'
import { dataset, downloadFile } from './lib/dataset'
import { exportCsv, formatNumber, type Station } from './lib/tariffs'

const SAVED_KEY = 'viaatlas.guardados.v1'
const stations = dataset.stations
function getView(): View {
  const hash = window.location.hash.slice(1)
  return hash === 'comparador' || hash === 'guardados' ? hash : 'explorador'
}
function loadSaved(): number[] {
  try {
    const values: unknown = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')
    return Array.isArray(values)
      ? stations.filter((s) => values.includes(s.id)).map((s) => s.id)
      : []
  } catch {
    return []
  }
}

export default function App() {
  const [view, setView] = useState(getView)
  const [savedIds, setSavedIds] = useState<number[]>(loadSaved)
  const [modal, setModal] = useState<'about' | Station | null>(null)
  const [pair, setPair] = useState<[number, number]>([stations[0].id, stations[1].id])
  const [toast, setToast] = useState<{ text: string } | null>(null)
  const list = useMemo(
    () => (view === 'guardados' ? stations.filter((s) => savedIds.includes(s.id)) : stations),
    [savedIds, view],
  )
  const close = useCallback(() => setModal(null), [])

  useEffect(() => {
    function update() {
      setView(getView())
      setModal(null)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  useEffect(() => {
    document.title = `${viewCopy[view].title} · VíaAtlas`
  }, [view])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3300)
    return () => window.clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    function sync(e: StorageEvent) {
      if (e.key === SAVED_KEY || e.key === null) setSavedIds(loadSaved())
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function toggleSaved(s: Station) {
    const remove = savedIds.includes(s.id)
    const next = remove ? savedIds.filter((id) => id !== s.id) : [...savedIds, s.id]
    setSavedIds(next)
    let message = remove ? `${s.name} se quitó de guardados.` : `${s.name} se añadió a guardados.`
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(next))
    } catch {
      message += ' Solo para esta sesión.'
    }
    setToast({ text: message })
  }
  function onCompare(s: Station) {
    setPair(([left, right]) => [s.id, right !== s.id ? right : left])
    setModal(null)
    window.location.hash = 'comparador'
  }
  function onExport(filtered: Station[], category = '') {
    const output = exportCsv(filtered, category)
    downloadFile(
      output.text,
      `ViaAtlas_tarifas${filtered.length === 1 ? `_ID${filtered[0].id}` : ''}${category ? `_cat-${category}` : ''}_20261118.csv`,
    )
    setToast({
      text: `Descarga preparada: ${formatNumber(output.count)} ${output.count === 1 ? 'tarifa' : 'tarifas'}.`,
    })
  }

  return (
    <>
      <a
        className="skip-link"
        href="#contenido"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('contenido')?.focus()
        }}
      >
        Saltar al contenido
      </a>
      <Header view={view} savedCount={savedIds.length} about={() => setModal('about')} />
      <main id="contenido" tabIndex={-1} className="container main-content">
        <Hero view={view} />
        {view === 'explorador' && <Metrics />}
        {view === 'comparador' ? (
          <Compare
            left={stations.find((s) => s.id === pair[0])!}
            right={stations.find((s) => s.id === pair[1])!}
            setPair={(a, b) => setPair([a, b])}
          />
        ) : (
          <Directory
            key={view}
            stations={list}
            onlySaved={view === 'guardados'}
            savedIds={savedIds}
            onOpen={setModal}
            onSave={toggleSaved}
            onCompare={onCompare}
            onExport={onExport}
          />
        )}
        <Footer about={() => setModal('about')} />
      </main>
      {modal === 'about' && <About close={close} />}
      {modal && modal !== 'about' && (
        <RatesModal
          station={modal}
          saved={savedIds.includes(modal.id)}
          onSave={() => toggleSaved(modal)}
          close={close}
          onCompare={() => onCompare(modal)}
          onExport={() => onExport([modal])}
        />
      )}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast">
            <CheckCircle2 size={17} />
            <span>{toast.text}</span>
            <button aria-label="Cerrar notificación" onClick={() => setToast(null)}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
