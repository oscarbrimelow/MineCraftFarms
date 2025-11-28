# Deployment Guide

Complete step-by-step deployment instructions for Minecraft Farms.

## Table of Contents

1. [Supabase Setup](#supabase-setup)
2. [GitHub Pages Deployment](#github-pages-deployment)
3. [Cloudflare Pages Deployment](#cloudflare-pages-deployment)
4. [Netlify Deployment](#netlify-deployment)
5. [Troubleshooting](#troubleshooting)

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: `minecraft-farms`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait 2-3 minutes for project to initialize

### Step 2: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy contents of `supabase/schema.sql`
4. Paste and click **Run**
5. Verify tables were created in **Table Editor**

### Step 3: Create Storage Bucket

1. Go to **Storage**
2. Click **New Bucket**
3. Name: `farm-images`
4. **Public bucket**: ✅ Enable
5. Click **Create**

### Step 4: Get API Keys

1. Go to **Settings > API**
2. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public** key → Use as `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → Use as `SUPABASE_SERVICE_ROLE_KEY` (for seeding only)

### Step 5: Seed Database

```bash
export VITE_SUPABASE_URL=your_project_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

npm run seed
```

## GitHub Pages Deployment

### Method 1: Automatic (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/minecraft-farms.git
   git push -u origin main
   ```

2. **Configure Secrets**
   - Go to repository **Settings > Secrets and variables > Actions**
   - Add secrets:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **Enable Pages**
   - Go to **Settings > Pages**
   - **Source**: Select "GitHub Actions"
   - The workflow will automatically deploy

4. **Update Base Path** (if repo name isn't `minecraft-farms`)
   - Edit `vite.config.ts`
   - Change base path to match your repo name:
     ```typescript
     base: '/your-repo-name/',
     ```

5. **Access Your Site**
   - URL: `https://yourusername.github.io/minecraft-farms/`
   - First deployment takes 2-3 minutes

### Method 2: Manual Deploy

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

## Cloudflare Pages Deployment

1. **Connect Repository**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com)
   - Click "Create a project"
   - Connect GitHub account
   - Select `minecraft-farms` repository

2. **Build Settings**
   - **Project name**: `minecraft-farms`
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`

3. **Environment Variables**
   - Click "Add variable"
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - (Optional) `VITE_YOUTUBE_API_KEY`

4. **Deploy**
   - Click "Save and Deploy"
   - First build takes 2-3 minutes
   - Subsequent pushes auto-deploy

5. **Custom Domain** (Optional)
   - In Pages dashboard, go to **Custom domains**
   - Add your domain and follow DNS instructions

## Netlify Deployment

1. **Connect Repository**
   - Go to [Netlify](https://netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect GitHub and select repository

2. **Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

3. **Environment Variables**
   - Go to **Site settings > Environment variables**
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **SPA Routing Fix**
   - Create `public/_redirects` file:
     ```
     /*    /index.html   200
     ```
   - This is already included in the project

5. **Deploy**
   - Click "Deploy site"
   - Auto-deploys on every push

## Troubleshooting

### Issue: Routes return 404 on GitHub Pages

**Solution**: 
- Ensure `public/404.html` exists
- Verify `vite.config.ts` has correct base path
- Clear browser cache

### Issue: Supabase connection errors

**Solution**:
- Check environment variables are set correctly
- Verify Supabase project is active
- Check RLS policies allow public reads

### Issue: Images not uploading

**Solution**:
- Verify storage bucket exists and is public
- Check Supabase storage policies
- Ensure bucket name matches (`farm-images`)

### Issue: Build fails in CI/CD

**Solution**:
- Check all secrets are set in GitHub/Cloudflare/Netlify
- Verify Node.js version (18+ required)
- Check build logs for specific errors

### Issue: Database seed fails

**Solution**:
- Use service role key (not anon key)
- Ensure schema.sql has been run
- Check Supabase project is active

## Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] Can create account and sign in
- [ ] Can upload a farm
- [ ] Images upload successfully
- [ ] Search works
- [ ] Comments work
- [ ] All routes work (no 404s)
- [ ] Mobile responsive
- [ ] Performance is good (Lighthouse score 90+)

## Monitoring

### Recommended Tools

- **Analytics**: Add Plausible or Google Analytics
- **Error Tracking**: Sentry (free tier)
- **Uptime**: UptimeRobot (free tier)

### Performance Targets

- **Lighthouse Score**: 90+ on mobile
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Largest Contentful Paint**: < 2.5s

## Support

If you encounter issues:

1. Check [GitHub Issues](https://github.com/yourusername/minecraft-farms/issues)
2. Review Supabase logs
3. Check browser console for errors
4. Verify all environment variables

