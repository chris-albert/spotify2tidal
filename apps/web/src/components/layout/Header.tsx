import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              <span className="text-spotify-green">Spotify</span>
              <span className="text-gray-400">2</span>
              <span className="text-tidal-blue">Tidal</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
              activeProps={{ className: 'text-gray-900 font-semibold' }}
            >
              Home
            </Link>
            <a
              href="https://github.com/yourusername/spotify2tidal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
