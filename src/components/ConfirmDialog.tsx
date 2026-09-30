import { Modal } from './Modal'

type Props = { open: boolean; title?: string; message: string; busy?: boolean; onCancel: () => void; onConfirm: () => void }
export function ConfirmDialog({ open, title = 'Confirmar eliminación', message, busy, onCancel, onConfirm }: Props) {
  return <Modal open={open} title={title} onClose={onCancel}><p className="confirm-message">{message}</p><div className="form-actions"><button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button><button className="danger-button" type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Eliminando...' : 'Eliminar'}</button></div></Modal>
}
