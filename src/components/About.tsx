import { CalendarDays, Database, Download, FileSpreadsheet, Info } from 'lucide-react'
import { dataset, snapshotDate, sourceFile, sourceUrl } from '../lib/dataset'
import { formatNumber, shortDate } from '../lib/tariffs'
import { Modal } from './Modal'

export function About({ close }: { close: () => void }) {
  return (
    <Modal labelledBy="about-title" close={close} className="about-modal">
      <div className="modal-banner">
        <div className="detail-kicker">
          <Database size={13} />
          FUENTE DE INFORMACIÓN
        </div>
        <h2 id="about-title">Acerca de los datos</h2>
      </div>
      <div className="about-body">
        <p>
          VíaAtlas permite consultar el archivo de tarifas de peajes de la{' '}
          <strong>Agencia Nacional de Infraestructura (ANI)</strong> proporcionado para esta
          aplicación.
        </p>
        <div className="source-summary">
          <span>
            <FileSpreadsheet size={17} />
            Archivo de origen
          </span>
          <strong>{sourceFile}</strong>
          <span>
            <CalendarDays size={16} />
            Corte del archivo: {shortDate(snapshotDate)}
          </span>
        </div>
        <h3>Cómo leer las cifras</h3>
        <p>
          El archivo reúne {formatNumber(dataset.count)} tarifas de {dataset.stations.length}{' '}
          estaciones y {dataset.categories.length} categorías. El promedio incluye todos los
          registros, también los de valor cero.
        </p>
        <p>
          El directorio muestra la categoría I como referencia hasta que eliges otra. Un guion
          significa «sin registro», no una tarifa de $ 0.
        </p>
        <div className="about-note">
          <Info size={16} />
          <span>
            No es una consulta en tiempo real. La fecha de cada tarifa indica su último cambio en el
            archivo; la ficha de estación muestra el más reciente de ellos.
          </span>
        </div>
      </div>
      <div className="modal-actions">
        <button className="button secondary" onClick={close}>
          Cerrar
        </button>
        <a className="button primary" href={sourceUrl} download={sourceFile}>
          <Download size={15} />
          Descargar archivo original
        </a>
      </div>
    </Modal>
  )
}
