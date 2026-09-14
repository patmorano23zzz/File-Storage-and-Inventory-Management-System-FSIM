import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const handler = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full ${widths[size]} max-h-[92dvh] sm:max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 border-b border-gray-200">
          <h3 className="min-w-0 font-semibold text-gray-900 truncate">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className="shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain flex-1 px-4 py-4 sm:px-6">{children}</div>
      </div>
    </div>
  )
}
