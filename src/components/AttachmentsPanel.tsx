import { Download, FileUp, Paperclip, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { attachmentsApi } from "../lib/operationsApi";
import type { Attachment, AttachmentEntity } from "../types/inventory";
import { ConfirmDialog } from "./ConfirmDialog";

export function AttachmentsPanel({
  entityType,
  entityId,
  canUpload = true,
  canDelete = false,
}: {
  entityType: AttachmentEntity;
  entityId: number;
  canUpload?: boolean;
  canDelete?: boolean;
}) {
  const [items, setItems] = useState<Attachment[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [deleting, setDeleting] = useState<Attachment | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const load = () =>
    attachmentsApi
      .list(entityType, entityId)
      .then(setItems)
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : "No se pudieron cargar los adjuntos.",
        ),
      );
  useEffect(() => {
    const timer = window.setTimeout(() => {
      attachmentsApi
        .list(entityType, entityId)
        .then(setItems)
        .catch((e) =>
          setError(
            e instanceof Error
              ? e.message
              : "No se pudieron cargar los adjuntos.",
          ),
        );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [entityType, entityId]);
  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo supera el máximo de 10 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await attachmentsApi.upload(entityType, entityId, file);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await attachmentsApi.remove(deleting.id);
      setDeleting(null);
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo borrar el adjunto.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="attachments-panel">
      <div className="detail-heading">
        <div>
          <strong>
            <Paperclip size={14} /> Evidencia y adjuntos
          </strong>
          <span>Imágenes, PDF o DOCX, máximo 10 MB.</span>
        </div>
        {canUpload && (
          <>
            <input
              ref={input}
              hidden
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.docx"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
            <button
              className="secondary-button"
              disabled={busy}
              type="button"
              onClick={() => input.current?.click()}
            >
              <FileUp size={14} />
              {busy ? "Subiendo..." : "Adjuntar"}
            </button>
          </>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="attachment-list">
        {items.map((item) => (
          <div className="attachment-row" key={item.id}>
            <div>
              <strong>{item.originalName}</strong>
              <span>
                {(item.size / 1024).toLocaleString("es-CL", {
                  maximumFractionDigits: 1,
                })}{" "}
                KB · {item.uploader} ·{" "}
                {new Date(item.createdAt).toLocaleDateString("es-CL")}
              </span>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() => void attachmentsApi.download(item)}
              aria-label={`Descargar ${item.originalName}`}
            >
              <Download size={14} />
            </button>
            {canDelete && (
              <button
                className="icon-button danger-icon"
                type="button"
                onClick={() => setDeleting(item)}
                aria-label={`Eliminar ${item.originalName}`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        {!items.length && (
          <p className="empty-inline">Sin archivos adjuntos.</p>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(deleting)}
        message={`¿Eliminar ${deleting?.originalName ?? "este archivo"}?`}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </section>
  );
}
