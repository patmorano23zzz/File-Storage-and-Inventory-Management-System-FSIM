import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil } from 'lucide-react'
import { useStudent, useUpsertStudent } from '../../hooks/useStudents'
import { useDocuments } from '../../hooks/useDocuments'
import { Badge } from '../../components/ui/index'
import Modal from '../../components/ui/Modal'
import StudentForm from '../../components/StudentForm'
import DocumentUploadForm from '../../components/DocumentUploadForm'
import DocumentList from '../../components/DocumentList'

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
  )
}

export default function AdminStudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [modal, setModal] = useState(null) // 'edit' | 'upload'

  const { data: student, isLoading } = useStudent(id)
  const { data: documents = [], isLoading: docsLoading } = useDocuments(id)
  const upsert = useUpsertStudent()

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
  if (!student) return <div className="p-8 text-center text-sm text-red-500">Student not found.</div>

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/admin/students')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* Student card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {student.last_name}, {student.first_name} {student.middle_name ?? ''}
            </h1>
            <p className="text-sm text-gray-400 font-mono mt-0.5">LRN: {student.lrn}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge label={student.status} />
            <button onClick={() => setModal('edit')}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors">
              <Pencil size={14} /> Edit
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoRow label="Grade Level" value={student.grade_level} />
          <InfoRow label="Section" value={student.section} />
          <InfoRow label="Sex" value={student.sex === 'M' ? 'Male' : student.sex === 'F' ? 'Female' : null} />
          <InfoRow label="Birth Date" value={student.birth_date} />
          <InfoRow label="Guardian" value={student.guardian_name} />
        </div>
      </div>

      {/* Documents */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">Documents ({documents.length})</h2>
        <button onClick={() => setModal('upload')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} /> Upload Document
        </button>
      </div>
      <DocumentList documents={documents} loading={docsLoading} />

      {/* Modals */}
      {modal === 'edit' && (
        <Modal title="Edit Student" onClose={() => setModal(null)} size="lg">
          <StudentForm
            initial={student}
            onSubmit={async form => { await upsert.mutateAsync(form); setModal(null) }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
      {modal === 'upload' && (
        <Modal title="Upload Document" onClose={() => setModal(null)} size="md">
          <DocumentUploadForm
            studentId={id}
            onSuccess={() => setModal(null)}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
