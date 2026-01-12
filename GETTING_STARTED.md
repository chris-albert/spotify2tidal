# Getting Started

## Phase 1: Foundation ✅ COMPLETE

The project foundation has been set up with:
- ✅ Turborepo monorepo structure
- ✅ React + TypeScript + Vite
- ✅ TanStack Router (file-based routing)
- ✅ Tailwind CSS
- ✅ Shared types package
- ✅ GitHub Actions deployment workflow

## Next Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

```bash
cp apps/web/.env.example apps/web/.env.local
```

Then edit `apps/web/.env.local` with your API credentials (see API Setup below).

### 3. Start Development Server

```bash
pnpm dev
```

This will start the Vite dev server at `http://localhost:5173`. You should see the homepage!

## API Setup (Required for Full Functionality)

### Spotify

1. Go to https://developer.spotify.com/dashboard
2. Create an app called "Spotify2Tidal"
3. Add redirect URI: `http://localhost:5173/auth/spotify`
4. Copy Client ID to `.env.local`:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id_here
   ```

### Tidal

1. Go to https://developer.tidal.com/
2. Register and create an application
3. Add redirect URI: `http://localhost:5173/auth/tidal`
4. Copy Client ID to `.env.local`:
   ```
   VITE_TIDAL_CLIENT_ID=your_client_id_here
   ```

## Project Structure

```
spotify2tidal/
├── apps/web/                       # Main React SPA
│   ├── src/
│   │   ├── routes/                 # TanStack Router routes
│   │   │   ├── __root.tsx          # Root layout ✅
│   │   │   └── index.tsx           # Homepage ✅
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── Header.tsx      # Navigation ✅
│   │   └── styles/
│   │       └── globals.css         # Tailwind CSS ✅
│   ├── vite.config.ts              # Vite configuration ✅
│   └── tailwind.config.ts          # Tailwind config ✅
├── packages/
│   ├── types/                      # Shared TypeScript types ✅
│   └── config/                     # Shared configs ✅
└── turbo.json                      # Turborepo config ✅
```

## What's Next?

**Phase 2: State Management & Storage** (Coming next)
- Set up Zustand stores for auth, extraction, and matching
- Create localStorage wrapper for tokens
- Implement IndexedDB for caching matches
- Create custom React hooks

**Phase 3: Spotify Integration**
- Implement PKCE OAuth flow
- Create Spotify API client
- Add data extraction logic

**Phase 4+:**
- Tidal integration
- Matching engine
- UI components
- Export functionality

## Current Features

✅ **Homepage** - Landing page with feature overview
✅ **Routing** - TanStack Router with type safety
✅ **Styling** - Tailwind CSS with Spotify/Tidal brand colors
✅ **Layout** - Header, footer, and responsive design
✅ **Build System** - Turborepo with optimized builds

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build for production |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint (when configured) |
| `pnpm clean` | Clean build artifacts |

## Troubleshooting

### "Cannot find module '@spotify2tidal/types'"
Run `pnpm install` from the root directory.

### Tailwind styles not working
Make sure `apps/web/src/styles/globals.css` is imported in `main.tsx`.

### Router devtools not showing
They only show in development mode. Make sure you're running `pnpm dev`.

## Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- Open an issue on GitHub if you encounter problems
- Review the [approved plan](~/.claude/plans/eager-leaping-hennessy.md) for architecture details

---

🚀 Ready to continue? The foundation is solid and ready for the next phase!
