import { X } from 'lucide-react'
import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ModalProps = { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }

export function Modal({ open, title, onClose, children, wide = false }: ModalProps) {
  const titleId = useId()
  const modalRef = useRef<HTMLElement>(null)
  const closeModal = useEffectEvent(onClose)
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    modalRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
      if (event.key !== 'Tab') return
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKeyDown); previouslyFocused?.focus() }
  }, [open])
  if (!open) return null
  return createPortal(<div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section ref={modalRef} tabIndex={-1} className={`modal-window ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header"><h2 id={titleId}>{title}</h2><button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar"><X size={18} /></button></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>, document.body)
}
