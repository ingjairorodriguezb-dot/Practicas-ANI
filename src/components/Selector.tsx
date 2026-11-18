import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { normalize } from '../lib/tariffs'

export type Choice = { value: string; label: string; hint?: string; keywords?: string }
type Props = {
  label: string
  value: string
  options: Choice[]
  onChange: (value: string) => void
  icon?: ReactNode
  placeholder: string
  buttonText?: string
}

export function Selector({
  label,
  value,
  options,
  onChange,
  icon,
  placeholder,
  buttonText,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const id = useId()
  const choices = options.filter((o) =>
    normalize(`${o.label} ${o.keywords ?? ''}`).includes(normalize(query)),
  )
  const text = buttonText ?? options.find((o) => o.value === value)?.label ?? label

  function show() {
    setQuery('')
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    )
    setOpen(true)
  }
  function close() {
    setOpen(false)
    trigger.current?.focus({ preventScroll: true })
  }
  function choose(v: string) {
    onChange(v)
    close()
  }

  useEffect(() => {
    if (!open) return
    input.current?.focus({ preventScroll: true })
    function outside(e: PointerEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  useEffect(() => {
    const row = list.current?.children[active] as HTMLElement | undefined
    if (!row || !list.current) return
    if (row.offsetTop < list.current.scrollTop) list.current.scrollTop = row.offsetTop
    if (row.offsetTop + row.offsetHeight > list.current.scrollTop + list.current.clientHeight) {
      list.current.scrollTop = row.offsetTop + row.offsetHeight - list.current.clientHeight
    }
  }, [active, open, query])

  function keydown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) =>
        Math.max(0, Math.min(choices.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1))),
      )
    }
    if (e.key === 'Enter' && choices[active]) {
      e.preventDefault()
      choose(choices[active].value)
    }
  }

  return (
    <div
      className="selector"
      ref={root}
      onBlur={(e) => {
        if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={`select-button ${open ? 'is-open' : ''}`}
        aria-label={`${label}: ${text}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            show()
          }
        }}
      >
        {icon}
        <span>{text}</span>
        <ChevronDown className="select-chevron" size={15} />
      </button>
      {open && (
        <div className="select-menu">
          <label className="select-search">
            <Search size={15} />
            <input
              ref={input}
              role="combobox"
              aria-label={placeholder}
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={id}
              aria-activedescendant={choices[active] ? `${id}-${active}` : undefined}
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={keydown}
            />
          </label>
          <ul ref={list} role="listbox" aria-label={label} id={id}>
            {choices.map((o, i) => (
              <li
                role="option"
                key={o.value}
                id={`${id}-${i}`}
                aria-selected={o.value === value}
                className={`${i === active ? 'option-active' : ''} ${o.value === value ? 'option-selected' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o.value)}
              >
                <span>{o.label}</span>
                {o.hint && <small>{o.hint}</small>}
                {o.value === value && <Check size={14} aria-hidden="true" />}
              </li>
            ))}
          </ul>
          {!choices.length && <p className="menu-empty">Sin coincidencias.</p>}
        </div>
      )}
    </div>
  )
}
