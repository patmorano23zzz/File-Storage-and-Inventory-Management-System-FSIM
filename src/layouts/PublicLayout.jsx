import { Link, Outlet, useLocation } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

export default function PublicLayout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
            <div className="bg-blue-600 text-white rounded-lg p-1">
              <BookOpen size={18} />
            </div>
            e-Records
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <Link
              to="/request"
              className={`font-medium transition-colors ${pathname === '/request' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Request a File
            </Link>
            <Link
              to="/track"
              className={`font-medium transition-colors ${pathname === '/track' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Track Request
            </Link>
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg transition-colors"
            >
              Staff Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        © {new Date().getFullYear()} e-Records — School File Storage & Inventory System
      </footer>
    </div>
  )
}
