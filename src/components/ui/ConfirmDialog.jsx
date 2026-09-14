import { AlertTriangle, Loader2 } from 'lucide-react'
import Modal from './Modal'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  loading = false,
  danger = false,
}) {
  return (
    <Modal title={title} onClose={loading ? () => {} : onClose} size="sm">
      <div className="flex gap-3">
        <div className={`shrink-0 rounded-full p-2 ${danger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          <AlertTriangle size={18} />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-60 ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
