import { useState } from 'react'
import { Download, Search, Plus, Loader2 } from 'lucide-react'
import { useAllDocuments } from '../../hooks/useDocuments'
import { useStudents } from '../../hooks/useStudents'
import { PageHeader } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import DocumentUploadForm from '../../components/DocumentUploadForm'
import DocumentList from '../../components/DocumentList'
import AlertMessage from '../../components/ui/AlertMessage'
import { downloadBackup } from '../../lib/api'

export default function AdminDocuments() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [backingUp, setBackingUp] = useState(false)

  async function handleBackup() {
    setBackingUp(true)
    try {
      await downloadBackup()
    } catch (error) {
      window.alert(error.message)
    } finally {
      setBackingUp(false)
    }
  }

  const { data: documents = [], isLoading, isError, error } = useAllDocuments(search)
  const { data: students = [] } = useStudents()

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="All uploaded student files"
        action={<div className="flex gap-2">
          <button onClick={handleBackup} disabled={backingUp}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {backingUp ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Backup ZIP
          </button>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> Upload Document
          </button>
        </div>}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isError && <div className="mb-4"><AlertMessage>{`Unable to load documents: ${error.message}`}</AlertMessage></div>}
      {!isError && <DocumentList documents={documents} loading={isLoading} />}

      {modal && (
        <Modal title="Upload Document" onClose={() => setModal(false)} size="md">
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Student *</label>
            <select
              required
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select student…</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.last_name}, {s.first_name} — {s.lrn}
                </option>
              ))}
            </select>
          </div>
          {selectedStudentId && (
            <DocumentUploadForm
              studentId={selectedStudentId}
              onSuccess={() => { setModal(false); setSelectedStudentId('') }}
              onCancel={() => { setModal(false); setSelectedStudentId('') }}
            />
          )}
        </Modal>
      )}
    </div>
  )
}
