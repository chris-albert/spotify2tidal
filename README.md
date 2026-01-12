# Spotify to Tidal Migration Tool

A modern web application to migrate your music library from Spotify to Tidal. Built with React, TypeScript, TanStack Router, and Tailwind CSS.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- 🎵 **Smart Track Matching** - Uses ISRC codes and fuzzy matching algorithms for high accuracy
- 📊 **Detailed Analytics** - Review confidence scores and manually verify matches
- 💾 **Export Ready** - Download your migration plan as JSON
- 🔐 **Secure OAuth** - PKCE-based authentication for both Spotify and Tidal
- 📱 **Responsive Design** - Works on desktop and mobile
- ⚡ **Fast Performance** - Built with Vite and optimized bundle splitting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Spotify Developer Account
- Tidal Developer Account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/spotify2tidal.git
   cd spotify2tidal
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

4. **Configure API credentials** (see setup guide below)

5. **Start development server**
   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:5173`

## 🔑 API Setup

### Spotify Developer Account

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create an App"
3. Fill in the details:
   - **App Name**: Spotify2Tidal
   - **App Description**: Personal music library migration tool
4. Add **Redirect URIs**:
   - Development: `http://localhost:5173/auth/spotify`
   - Production: `https://yourusername.github.io/spotify2tidal/auth/spotify`
5. Copy the **Client ID** and add it to `apps/web/.env.local`:
   ```bash
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   ```

### Tidal Developer Account

1. Go to [Tidal Developer Portal](https://developer.tidal.com/)
2. Register for developer access
3. Create a new application
4. Add **Redirect URIs**:
   - Development: `http://localhost:5173/auth/tidal`
   - Production: `https://yourusername.github.io/spotify2tidal/auth/tidal`
5. Copy the **Client ID** and add it to `apps/web/.env.local`:
   ```bash
   VITE_TIDAL_CLIENT_ID=your_tidal_client_id
   ```

## 📦 Project Structure

```
spotify2tidal/
├── apps/
│   └── web/                 # Main React SPA
│       ├── src/
│       │   ├── routes/      # TanStack Router routes
│       │   ├── components/  # React components
│       │   ├── lib/         # Services, utils, stores
│       │   ├── hooks/       # Custom React hooks
│       │   └── store/       # Zustand state management
├── packages/
│   ├── types/              # Shared TypeScript types
│   └── config/             # Shared configurations
├── turbo.json              # Turborepo configuration
└── pnpm-workspace.yaml     # pnpm workspace definition
```

## 🛠 Available Scripts

### Root
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm deploy` - Build and deploy to GitHub Pages

### App (apps/web)
- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build with TypeScript and Vite
- `pnpm preview` - Preview production build
- `pnpm type-check` - Run TypeScript type checking

## 🚢 Deployment

### GitHub Pages

1. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: GitHub Actions

2. **Add Repository Secrets**
   - Go to Settings → Secrets and variables → Actions
   - Add:
     - `VITE_SPOTIFY_CLIENT_ID`
     - `VITE_TIDAL_CLIENT_ID`

3. **Update Redirect URIs**
   - Add production URLs to Spotify and Tidal developer dashboards
   - Format: `https://yourusername.github.io/spotify2tidal/auth/spotify`

4. **Deploy**
   ```bash
   git push origin main
   ```

   GitHub Actions will automatically build and deploy.

## ⚠️ Important Limitations

**Current Tidal API Limitations (as of Jan 2026):**

Tidal's official API does NOT yet support:
- Creating playlists
- Adding tracks to playlists
- Adding albums to library
- Following artists

**What This Tool Does:**
1. Extracts your complete Spotify library
2. Matches tracks/albums/artists using ISRC and fuzzy matching
3. Generates a detailed migration plan (JSON export)
4. Provides confidence scores for all matches

**Future:**
When Tidal's API is complete, this tool will be updated to support full automated migration.

## 🏗 Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript 5
- **Routing**: TanStack Router (type-safe, file-based)
- **Styling**: Tailwind CSS 3
- **State**: Zustand 4
- **Build**: Vite 5, Turborepo
- **Package Manager**: pnpm 8

### Key Features
- **PKCE OAuth Flow** - Secure browser-based authentication
- **Multi-Strategy Matching**:
  1. ISRC matching (highest accuracy)
  2. Exact metadata matching
  3. Fuzzy matching with confidence scoring
- **Rate Limiting** - Respects API limits
- **Error Handling** - Comprehensive retry logic
- **Progress Tracking** - Real-time UI updates

## 📝 Matching Algorithm

1. **ISRC Match** (99%+ accuracy)
   - Uses International Standard Recording Code
   - Unique identifier across platforms

2. **Exact Metadata Match** (95% accuracy)
   - Normalized track name + artist name
   - Duration within 2 seconds

3. **Fuzzy Match** (85%+ accuracy)
   - Levenshtein distance algorithm
   - Weighted scoring:
     - Title similarity: 50%
     - Artist similarity: 30%
     - Duration similarity: 10%
     - Album similarity: 10%

4. **Manual Review** (user input)
   - Low-confidence matches queued for review
   - Search suggestions provided

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Tidal Developer Platform](https://developer.tidal.com/)
- [TanStack Router](https://tanstack.com/router)
- [Tailwind CSS](https://tailwindcss.com/)

## 📧 Support

If you have any questions or run into issues, please [open an issue](https://github.com/yourusername/spotify2tidal/issues).

---

Built with ❤️ for music lovers
