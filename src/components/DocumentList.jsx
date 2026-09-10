import { useState } from 'react'
import { FileText, Trash2, ExternalLink, Lock, Loader2 } from 'lucide-react'
import { useDeleteDocument, getSignedUrl } from '../hooks/useDocuments'
import { useToast } from '../context/ToastContext'
import { Badge } from './ui/index'

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentList({ documents = [], loading, canDelete = true }) {
  const deleteDoc = useDeleteDocument()
  const toast = useToast()
  const [opening, setOpening] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function openFile(doc) {
    setOpening(doc.id)
    try {
      const url = await getSignedUrl(doc.storage_path)
      window.open(url, '_blank', 'noopener')
    } catch (e) {
      toast('Could not open file: ' + e.message, 'error')
    } finally {
      setOpening(null)
    }
  }

  async function handleDelete(doc) {
    try {
      await deleteDoc.mutateAsync({ id: doc.id, storagePath: doc.storage_path })
      toast(`"${doc.title}" deleted.`, 'success')
    } catch (e) {
      toast('Delete failed: ' + e.message, 'error')
    } finally {
      setConfirmDelete(null)
    }
  }

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
  if (!documents.length) return (
    <div className="py-12 text-center text-sm text-gray-400 bg-white rounded-xl border border-gray-200">
      No documents uploaded yet.
    </div>
  )

  return (
    <>
      <div className="space-y-2">
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition-colors">
            <FileText size={20} className="text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-gray-900 truncate">{doc.title}</span>
                {doc.is_classified && (
                  <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                    <Lock size={10} /> Classified
                  </span>
                )}
                <Badge label={doc.document_types?.code ?? '—'} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {doc.school_year && `SY ${doc.school_year} · `}
                {doc.grade_level && `${doc.grade_level} · `}
                {formatBytes(doc.file_size)} · {doc.profiles?.full_name ?? 'Unknown'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openFile(doc)}
                disabled={opening === doc.id}
                className="text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                title="Open file"
              >
                {opening === doc.id ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
              </button>
              {canDelete && (
                <button
                  onClick={() => setConfirmDelete(doc)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Inline confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Delete Document?</h3>
            <p className="text-sm text-gray-500 mb-5">
              "<span className="font-medium text-gray-700">{confirmDelete.title}</span>" will be permanently removed. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleteDoc.isPending}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {deleteDoc.isPending && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
