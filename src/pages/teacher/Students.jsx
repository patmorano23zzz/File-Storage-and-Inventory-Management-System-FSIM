import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import { useStudents } from '../../hooks/useStudents'
import { useMyAssignments, studentMatchesAssignments } from '../../hooks/useAssignments'
import { PageHeader, Badge } from '../../components/ui/index'

export default function TeacherStudents() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: students = [], isLoading } = useStudents(search)
  const { data: assignments = [], isLoading: assignmentsLoading } = useMyAssignments()

  const assigned = students.filter(s => studentMatchesAssignments(s, assignments))

  return (
    <div className="page-enter">
      <PageHeader title="Student Directory" subtitle="Browse enrolled students" />

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or LRN…"
          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
        />
      </div>

      <div className="table-scroll interactive-card bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading || assignmentsLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : assigned.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No students found. You only see students in the grade levels &amp; sections assigned to you by the admin.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['LRN', 'Name', 'Grade & Section', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assigned.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/teacher/students/${s.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.lrn}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.last_name}, {s.first_name} {s.middle_name ?? ''}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.grade_level}{s.section ? ` — ${s.section}` : ''}</td>
                  <td className="px-4 py-3"><Badge label={s.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight size={18} className="text-gray-400 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
