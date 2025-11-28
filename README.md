# Minecraft Farms 🧱

A beautiful, animated, multi-page website for discovering and sharing Minecraft farm designs across all versions and platforms. Built with React, Vite, Tailwind CSS, and Framer Motion, deployed for free on GitHub Pages.

![Minecraft Farms](https://img.shields.io/badge/Minecraft-Farms-green) ![React](https://img.shields.io/badge/React-18.2-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- **Multi-Platform Support**: Java, Bedrock, Xbox, PlayStation, Switch, Mobile
- **Version Filtering**: Filter farms by exact Minecraft versions
- **Community Features**: Upload, comment, upvote, and share farms
- **YouTube Integration**: Embed videos and extract captions to build steps
- **Search & Filter**: Powerful search across titles, materials, and tags
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Free Hosting**: Deploy for free on GitHub Pages or Cloudflare Pages
- **User Accounts**: Full authentication and profiles via Supabase
- **Moderation**: Built-in reporting and moderation panel

## 🚀 Quick Start

### Preview Without Setup (Recommended First Step!)

You can preview the entire website **without any setup**:

```bash
git clone https://github.com/yourusername/minecraft-farms.git
cd minecraft-farms
npm install
npm run dev
```

Visit `http://localhost:5173` - You'll see demo data and a demo mode banner!

See [PREVIEW.md](./PREVIEW.md) for details on preview mode.

### Full Setup (For Production)

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works perfectly) - **only needed for full functionality**
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/minecraft-farms.git
cd minecraft-farms
npm install
```

### 2. Set Up Supabase (Optional for Preview)

**Skip this step if you just want to preview!** The app works with demo data.

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Storage** and create a bucket named `farm-images` (make it public)
4. Copy your project URL and anon key from **Settings > API**

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_YOUTUBE_API_KEY=your_youtube_api_key_optional
```

### 4. Seed the Database

```bash
# Set service role key for seeding
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run seed script
npm run seed
```

This creates a test account:
- Email: `test@minecraftfarms.com`
- Password: `testpassword123`

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## 📦 Deployment

### Option 1: GitHub Pages (Recommended)

1. **Push to GitHub**

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/minecraft-farms.git
git push -u origin main
```

2. **Configure GitHub Secrets**

Go to your repository **Settings > Secrets and variables > Actions** and add:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

3. **Enable GitHub Pages**

- Go to **Settings > Pages**
- Source: **GitHub Actions**
- The workflow will automatically deploy on push to `main`

4. **Update Base Path** (if needed)

If your repo is not at the root of your GitHub Pages site, update `vite.config.ts`:

```typescript
base: '/your-repo-name/',
```

### Option 2: Cloudflare Pages

1. **Connect Repository**

- Go to [Cloudflare Pages](https://pages.cloudflare.com)
- Connect your GitHub repository
- Select the `main` branch

2. **Build Settings**

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

3. **Environment Variables**

Add in Cloudflare Pages dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

4. **Deploy**

Cloudflare will automatically build and deploy on every push.

### Option 3: Netlify

1. Connect your GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Add a `_redirects` file in `public/`:

```
/*    /index.html   200
```

## 🗄️ Database Schema

The project uses Supabase (PostgreSQL) with the following main tables:

- **users**: User profiles and authentication
- **farms**: Farm designs with materials, versions, tags
- **comments**: Comments and replies on farms
- **upvotes**: User upvotes on farms
- **reports**: Moderation reports

See `supabase/schema.sql` for full schema.

## 🎨 Design System

### Colors

- **Green**: `#7CB342` - Primary actions, success
- **Indigo**: `#5C6BC0` - Secondary actions, links
- **Gold**: `#FFB300` - Accents, highlights
- **Sky**: `#87CEEB` - Backgrounds

### Typography

- **Display**: Press Start 2P (Minecraft-inspired pixel font)
- **Body**: Inter (modern, readable)

### Components

All components use Tailwind CSS with custom Minecraft-inspired shadows and animations via Framer Motion.

## 🔧 Development

### Project Structure

```
minecraft-farms/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── lib/            # Utilities, Supabase client
│   └── App.tsx         # Main app component
├── supabase/
│   └── schema.sql      # Database schema
├── scripts/
│   └── seed.ts         # Seed data script
├── public/
│   └── 404.html        # GitHub Pages routing fix
└── .github/
    └── workflows/
        └── deploy.yml  # CI/CD workflow
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run seed` - Seed database with sample data
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🎥 YouTube Captions Feature

The YouTube captions-to-steps feature requires a serverless function. Two options:

### Option 1: Cloudflare Workers (Free)

Create a worker that fetches YouTube captions. See `serverless/youtube-captions.js` for an example.

### Option 2: Manual Input

Users can paste captions or upload SRT files, which are automatically parsed into steps.

## 🧪 Testing

Basic Playwright tests are included. Run with:

```bash
npm test
```

## 📝 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Icons from [Lucide](https://lucide.dev)
- Images from [Unsplash](https://unsplash.com) and [Pexels](https://pexels.com)
- Fonts from [Google Fonts](https://fonts.google.com)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ by the Minecraft community

