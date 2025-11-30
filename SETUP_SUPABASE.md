# Supabase Setup Instructions

## ✅ Step 1: Add Secrets to GitHub

Go to your repository and add the following secrets:

1. Navigate to: **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add these two secrets:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `YOUR_SUPABASE_PROJECT_URL` (Get from Supabase Dashboard > Settings > API)

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `YOUR_SUPABASE_ANON_KEY` (Get from Supabase Dashboard > Settings > API)

This allows GitHub Actions to build your site with Supabase credentials.

## ✅ Step 2: Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/schema.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify tables were created in **Table Editor**

## ✅ Step 3: Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New Bucket**
3. Name: `farm-images`
4. **Public bucket**: ✅ Enable (check the box)
5. Click **Create**

## ✅ Step 4: Seed Database (Optional)

If you want to add sample farms, run the seed script:

```bash
# Make sure .env.local has SUPABASE_SERVICE_ROLE_KEY set
npm run seed
```

This creates:
- A test user (test@minecraftfarms.com / testpassword123)
- Sample farms for testing

## ✅ Step 5: Test Locally

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:5173`
3. The demo banner should be gone (you're using real Supabase now!)
4. Try signing up for a new account

## ✅ Step 6: Verify GitHub Deployment

After adding the secrets:
1. The next GitHub Actions build will use your Supabase credentials
2. Your deployed site will connect to the real database
3. Users can sign up and upload farms!

---

**Important Notes:**
- Never commit `.env.local` (it's in .gitignore)
- Never share your Service Role key publicly
- The Anon key is safe to use in frontend code (that's its purpose)

