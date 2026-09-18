import { ShieldCheck } from 'lucide-react'

export default function BrandMark({ compact = false }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2 text-white shadow-md shadow-blue-500/20">
        <ShieldCheck size={compact ? 18 : 22} strokeWidth={2.4} />
      </span>
      <span className="leading-tight">
        <span className="block font-extrabold tracking-tight">EduVault</span>
        {!compact && <span className="block text-[10px] font-medium text-slate-500">Student Records &amp; Documents</span>}
      </span>
    </span>
  )
}
