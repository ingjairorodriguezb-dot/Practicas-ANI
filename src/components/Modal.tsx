import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = { labelledBy: string; close: () => void; children: ReactNode; className?: string }

export function Modal({ labelledBy, close, children, className = '' }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = dialog.current!
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    el.showModal()
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      el.close()
      document.body.style.overflow = oldOverflow
      previousFocus?.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className={`modal ${className}`}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClick={(e) => {
        if (e.target !== dialog.current) return
        const box = dialog.current.getBoundingClientRect()
        if (
          e.clientX < box.left ||
          e.clientX > box.right ||
          e.clientY < box.top ||
          e.clientY > box.bottom
        )
          close()
      }}
    >
      <button
        type="button"
        className="icon-button modal-close"
        aria-label="Cerrar ventana"
        onClick={close}
      >
        <X size={18} />
      </button>
      {children}
    </dialog>
  )
}
