# 🎮 Preview Mode

You can preview the entire website **without setting up Supabase**! The app automatically uses mock data when Supabase credentials aren't configured.

## Quick Start (No Setup Required)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the dev server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   ```
   http://localhost:5173
   ```

That's it! You'll see a demo banner at the top indicating you're in preview mode.

## What Works in Preview Mode

✅ **All pages and navigation**
✅ **Browse farms** (6 demo farms)
✅ **View farm details** with materials, tags, etc.
✅ **Search and filters** (client-side)
✅ **UI/UX** - See all animations, design, responsiveness
✅ **Comments** (read-only demo comments)
✅ **Platform filters** and tags

## What's Limited in Preview Mode

❌ **Sign in/Sign up** - Authentication disabled
❌ **Upload farms** - Requires Supabase
❌ **Upvote** - Requires database
❌ **Post comments** - Requires database
❌ **User profiles** - Requires authentication
❌ **Moderation** - Requires admin role

## Demo Data

The preview includes:
- 6 sample farms across different platforms
- Demo comments on some farms
- All UI components and interactions
- Responsive design testing

## Enabling Full Functionality

To enable all features:

1. **Set up Supabase** (see [DEPLOYMENT.md](./DEPLOYMENT.md))
2. **Create `.env.local`:**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. **Restart dev server:**
   ```bash
   npm run dev
   ```

The demo banner will disappear and all features will work!

## Building for Production

Even in demo mode, you can build the site:

```bash
npm run build
npm run preview
```

The built site will also run in demo mode if Supabase credentials aren't set.

---

**Tip:** Use preview mode to:
- Show the design to stakeholders
- Test UI/UX without backend setup
- Develop frontend features independently
- Demo the site before deployment

