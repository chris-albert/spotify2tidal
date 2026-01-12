# Deployment Guide - GitHub Pages

This guide will help you deploy the Spotify2Tidal app to GitHub Pages with hash routing.

## ✅ What's Already Configured

The following has been set up for you:
- ✅ Hash routing for SPA compatibility
- ✅ Vite base path configured (`/spotify2tidal/`)
- ✅ GitHub Actions workflow created
- ✅ Build optimizations (code splitting, source maps)

## 📋 Prerequisites

1. **GitHub Account** - You need a GitHub account
2. **GitHub Repository** - Create a repository named `spotify2tidal`
3. **Spotify Developer Account** - https://developer.spotify.com/dashboard
4. **Tidal Developer Account** - https://developer.tidal.com/

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

```bash
cd /Users/christopheralbert/git/spotify2tidal

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Spotify2Tidal migration tool"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/spotify2tidal.git

# Push to main branch
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The workflow will automatically deploy on push to `main`

### Step 3: Configure GitHub Secrets

Add your API keys as GitHub repository secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

**VITE_SPOTIFY_CLIENT_ID**
```
Your Spotify Client ID from https://developer.spotify.com/dashboard
```

**VITE_TIDAL_CLIENT_ID**
```
Your Tidal Client ID from https://developer.tidal.com/
```

### Step 4: Update OAuth Redirect URIs

#### Spotify Developer Dashboard

1. Go to https://developer.spotify.com/dashboard
2. Click on your app (or create one: "Spotify2Tidal")
3. Click **Settings**
4. Under **Redirect URIs**, add:

```
Development:
http://localhost:5173/spotify2tidal/#/auth/spotify

Production:
https://YOUR_USERNAME.github.io/spotify2tidal/#/auth/spotify
```

**Important:** Note the `#/` in the URL - this is required for hash routing!

5. Click **Save**

#### Tidal Developer Dashboard

1. Go to https://developer.tidal.com/
2. Sign in and go to your application
3. Add redirect URIs:

```
Development:
http://localhost:5173/spotify2tidal/#/auth/tidal

Production:
https://YOUR_USERNAME.github.io/spotify2tidal/#/auth/tidal
```

**Important:** Again, note the `#/` for hash routing!

4. Save changes

### Step 5: Deploy!

The deployment happens automatically when you push to `main`:

```bash
git add .
git commit -m "Update: Deploy to GitHub Pages"
git push
```

Watch the deployment:
1. Go to **Actions** tab in GitHub
2. See the workflow running
3. Once complete, visit: `https://YOUR_USERNAME.github.io/spotify2tidal/`

## 🌐 Your App URLs

After deployment, your app will be available at:

**Production URL:**
```
https://YOUR_USERNAME.github.io/spotify2tidal/
```

**Route Examples (with hash routing):**
```
Homepage:       https://YOUR_USERNAME.github.io/spotify2tidal/#/
Extraction:     https://YOUR_USERNAME.github.io/spotify2tidal/#/extract
Match Review:   https://YOUR_USERNAME.github.io/spotify2tidal/#/match
Export:         https://YOUR_USERNAME.github.io/spotify2tidal/#/export
```

## 🔧 Hash Routing Explained

### Why Hash Routing?

GitHub Pages serves static files and doesn't support server-side routing. When you navigate to `/match`, GitHub Pages looks for a file called `match` and returns 404.

Hash routing solves this by using the URL hash (`#/`), which is client-side only and doesn't trigger server requests.

### How It Works

**Traditional routing (doesn't work on GitHub Pages):**
```
https://example.github.io/spotify2tidal/match
                                     ↑
                          Server tries to find this file → 404
```

**Hash routing (works perfectly):**
```
https://example.github.io/spotify2tidal/#/match
                                     ↑
                          Everything after # is client-side
```

### Configuration

The hash routing is configured in `apps/web/src/main.tsx`:

```typescript
import { createHashHistory } from '@tanstack/react-router'

const hashHistory = createHashHistory()

const router = createRouter({
  routeTree,
  history: hashHistory,
  basepath: '/spotify2tidal',
})
```

## 🔐 OAuth Configuration Summary

### Spotify OAuth Settings

**Application Name:** Spotify2Tidal

**Redirect URIs:**
```
http://localhost:5173/spotify2tidal/#/auth/spotify
https://YOUR_USERNAME.github.io/spotify2tidal/#/auth/spotify
```

**Scopes Required:**
- `user-library-read` - Read saved tracks and albums
- `playlist-read-private` - Read private playlists
- `playlist-read-collaborative` - Read collaborative playlists
- `user-follow-read` - Read followed artists

### Tidal OAuth Settings

**Application Name:** Spotify2Tidal

**Redirect URIs:**
```
http://localhost:5173/spotify2tidal/#/auth/tidal
https://YOUR_USERNAME.github.io/spotify2tidal/#/auth/tidal
```

**Scopes Required:**
- `r_usr` - Read user information
- `w_usr` - Write user information (future)
- `w_sub` - Manage subscriptions (future)

## 📦 Environment Variables

### Local Development (.env.local)

Create `apps/web/.env.local`:

```bash
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_TIDAL_CLIENT_ID=your_tidal_client_id_here
```

**Note:** Do NOT commit `.env.local` to git (it's already in `.gitignore`)

### Production (GitHub Secrets)

Set in GitHub: **Settings** → **Secrets and variables** → **Actions**

- `VITE_SPOTIFY_CLIENT_ID`
- `VITE_TIDAL_CLIENT_ID`

## 🧪 Testing Deployment

### Test Locally with Production Build

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Visit: http://localhost:4173/spotify2tidal/
```

### Test Production Deployment

1. Visit your GitHub Pages URL
2. Check all routes work (they should all have `#/` in URL)
3. Test OAuth flows:
   - Click "Connect Spotify"
   - Should redirect to Spotify login
   - Should redirect back to `/#/auth/spotify`
   - Should show "Connected" status
4. Repeat for Tidal
5. Test full extraction → matching → export flow

## 🐛 Troubleshooting

### Issue: OAuth Redirect Fails

**Problem:** After authorizing, redirect fails with "Invalid redirect URI"

**Solution:** 
- Double-check redirect URIs include `#/` in both dashboards
- Exact format: `https://YOUR_USERNAME.github.io/spotify2tidal/#/auth/spotify`
- Clear browser cache and try again

### Issue: Routes Return 404

**Problem:** Direct navigation to routes like `/match` returns 404

**Solution:**
- Hash routing should prevent this
- URLs should look like `/#/match`, not `/match`
- Check that `createHashHistory()` is configured in `main.tsx`

### Issue: Build Fails in GitHub Actions

**Problem:** GitHub Actions workflow fails

**Solution:**
- Check that secrets are set correctly
- Verify `pnpm-lock.yaml` is committed
- Check workflow logs in Actions tab
- Ensure all dependencies are in `package.json`

### Issue: Blank Page After Deployment

**Problem:** GitHub Pages shows blank page

**Solution:**
- Check browser console for errors
- Verify base path is correct: `/spotify2tidal/`
- Check that `index.html` exists in `apps/web/dist/` after build
- View source of deployed page to check if assets are loading

### Issue: Assets Not Loading (404 for JS/CSS)

**Problem:** JavaScript and CSS files return 404

**Solution:**
- Verify Vite config has correct `base: '/spotify2tidal/'`
- Check that assets have correct path prefix in HTML
- Rebuild and redeploy

## 📊 Deployment Checklist

- [ ] Code pushed to GitHub repository
- [ ] GitHub Pages enabled (Settings → Pages → GitHub Actions)
- [ ] GitHub secrets added (VITE_SPOTIFY_CLIENT_ID, VITE_TIDAL_CLIENT_ID)
- [ ] Spotify redirect URIs updated (with `#/`)
- [ ] Tidal redirect URIs updated (with `#/`)
- [ ] First deployment successful (check Actions tab)
- [ ] Production URL accessible
- [ ] Hash routing working (URLs contain `#/`)
- [ ] Spotify OAuth working
- [ ] Tidal OAuth working
- [ ] All routes accessible
- [ ] Extraction working
- [ ] Matching working
- [ ] Export working

## 🎉 Success!

Once all checks pass, your app is live at:

```
https://YOUR_USERNAME.github.io/spotify2tidal/
```

Share it with friends and start migrating playlists!

## 🔄 Continuous Deployment

Every push to `main` branch will automatically:
1. Run the build
2. Run tests (if configured)
3. Deploy to GitHub Pages
4. Update your live site

To disable auto-deployment:
- Edit `.github/workflows/deploy.yml`
- Change `on.push.branches` or remove the push trigger

## 📝 Custom Domain (Optional)

To use a custom domain like `spotify2tidal.yourdomain.com`:

1. Add CNAME record in your DNS:
   ```
   CNAME  spotify2tidal  YOUR_USERNAME.github.io
   ```

2. In GitHub repository:
   - Settings → Pages
   - Add custom domain: `spotify2tidal.yourdomain.com`
   - Enable "Enforce HTTPS"

3. Update OAuth redirect URIs:
   ```
   https://spotify2tidal.yourdomain.com/#/auth/spotify
   https://spotify2tidal.yourdomain.com/#/auth/tidal
   ```

4. Update Vite config base path:
   ```typescript
   base: '/' // Remove /spotify2tidal/ for custom domain
   ```

## 🛠️ Manual Deployment (Alternative)

If you prefer manual deployment without GitHub Actions:

```bash
# Build
pnpm build

# Install gh-pages
pnpm add -D gh-pages

# Deploy
pnpm gh-pages -d apps/web/dist
```

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [TanStack Router Docs](https://tanstack.com/router/latest/docs)
- [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api)
- [Tidal Developer Docs](https://developer.tidal.com/)

---

Need help? Open an issue on GitHub!
