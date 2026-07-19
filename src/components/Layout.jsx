import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Layout({ children, navLinks = [] }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              aria-label="Retour à la page précédente"
              className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <Link to={profile?.role === 'responsable' ? '/responsable' : '/assistante'}
              className="flex items-center gap-2 font-bold text-pharmacy-green text-sm">
              <div className="w-7 h-7 bg-pharmacy-green rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              Pharma Gate
            </Link>
          </div>

          {/* User info + menu */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{profile?.full_name || profile?.username}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{profile?.role}</p>
            </div>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Ouvrir le menu"
              className="p-2 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Overlay du menu */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Menu hamburger — coulisse depuis la droite */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 max-w-[80%] bg-white dark:bg-gray-800 z-50 shadow-xl flex flex-col transition-transform duration-300 ease-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <span className="font-semibold text-gray-900 dark:text-gray-100">Menu</span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer le menu"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 text-sm transition-colors ${
                location.pathname === link.to
                  ? 'bg-pharmacy-green-light text-pharmacy-green font-medium dark:bg-pharmacy-green/20 dark:text-green-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="border-t border-gray-100 dark:border-gray-700 p-2 flex-shrink-0">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
