import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

const variants = {
  error: {
    icon: AlertTriangle,
    wrapper: 'border-red-200 bg-red-50 text-red-700',
    iconWrap: 'bg-red-100 text-red-600',
  },
  success: {
    icon: CheckCircle2,
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    iconWrap: 'bg-emerald-100 text-emerald-600',
  },
  info: {
    icon: Info,
    wrapper: 'border-blue-200 bg-blue-50 text-blue-700',
    iconWrap: 'bg-blue-100 text-blue-600',
  },
}

export default function AlertMessage({ children, variant = 'error' }) {
  const config = variants[variant]
  const Icon = config.icon

  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={`animate-[fadeIn_.2s_ease-out] flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${config.wrapper}`}>
      <span className={`mt-[-1px] shrink-0 rounded-full p-1.5 ${config.iconWrap}`}>
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1 leading-5">{children}</span>
    </div>
  )
}
