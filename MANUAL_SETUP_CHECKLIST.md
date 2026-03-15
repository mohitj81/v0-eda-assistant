# Manual Setup Checklist - What You Need to Do

This document lists all the manual steps you need to complete after downloading the EDA Assistant project. Follow these steps in order.

---

## Step 1: Get Google API Key (Required for AI Insights)

**Time: 5 minutes**

### Option A: Using Google AI Studio (Easiest)

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Select your project or create a new one
4. Copy the API key (it will look like: `AIzaSy...`)
5. Keep this key safe - you'll need it in Step 3

### Option B: Using Google Cloud Console

1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable "Generative Language API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

**Status**: Check when you have your API key

---

## Step 2: Clone/Download Project and Install

**Time: 10 minutes**

### Using v0 (Already Done)

If you downloaded from v0, skip to Step 3.

### Using Git

```bash
# Clone the repository
git clone <repository-url>
cd eda-assistant

# Install dependencies
pnpm install
# or: npm install
# or: yarn install
```

**Status**: Check when installation is complete

---

## Step 3: Configure Environment Variables

**Time: 3 minutes**

### Local Development Setup

1. In the project root, create a file named `.env.local`
2. Add this single required variable:

```env
GOOGLE_API_KEY=your_api_key_from_step_1_here
```

3. Save the file

**Important**: 
- This file should NOT be committed to git
- It should be in your `.gitignore` (already is)
- Replace `your_api_key_from_step_1_here` with your actual key

### Example .env.local

```env
GOOGLE_API_KEY=AIzaSyDXZ1234567890abcdefghijklmnop
```

**Status**: Check when .env.local is created with your API key

---

## Step 4: Test Locally

**Time: 5 minutes**

```bash
# Start the development server
pnpm dev
# or: npm run dev
# or: yarn dev

# Open browser to http://localhost:3000
```

### What to Test

1. Home page loads at `http://localhost:3000`
2. Click "Upload Data" or go to `/upload`
3. Try uploading a sample CSV file
4. Verify the file uploads and redirects to analysis page
5. Check that the Insights tab shows data analysis

**Status**: Check when you can upload and analyze a file

---

## Step 5 (Optional): Set Up Database

**Time: 15-30 minutes**

### If You Want to Persist Data

The app currently stores files in `public/uploads/` (temporary). For production, set up a database:

#### Option A: Supabase (Recommended)

1. Go to https://supabase.com and create account
2. Create a new project
3. Get connection string from Settings → Database
4. Add to `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/db
   ```

#### Option B: Vercel Postgres

1. Deploy to Vercel first (see Step 6)
2. In Vercel dashboard, go to Storage → Postgres
3. Create database
4. Vercel will automatically add `DATABASE_URL`

#### Option C: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database
3. Add connection string to `.env.local`

**Status**: Check when database is configured (optional)

---

## Step 6: Deploy to Vercel (Optional but Recommended)

**Time: 10 minutes**

### Prerequisites

- GitHub account (push code there)
- Vercel account (free tier works)

### Deployment Steps

1. **Push to GitHub**:
   ```bash
   git remote add origin <your-github-repo-url>
   git add .
   git commit -m "Initial commit: EDA Assistant"
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Click "Import"

3. **Configure Environment Variables in Vercel**:
   - In Vercel project settings, go to "Environment Variables"
   - Add your variables:
     - Key: `GOOGLE_API_KEY`
     - Value: Your API key from Step 1
   - Click "Save"

4. **Deploy**:
   - Vercel will automatically deploy
   - You'll get a public URL like: `https://your-project.vercel.app`
   - App is now live!

**Status**: Check when app is deployed and accessible online

---

## Step 7 (Optional): Custom Domain

**Time: 5-10 minutes**

### Add Your Domain to Vercel

1. In Vercel project settings, go to "Domains"
2. Add your domain name
3. Follow DNS configuration instructions
4. DNS propagation takes 5-48 hours

**Status**: Check when domain is configured (optional)

---

## Step 8: Optional Enhancements

**Time: Varies**

### Add More Features

These are optional but make the app more powerful:

1. **User Authentication**:
   - Integrate Supabase Auth or Auth0
   - Requires adding auth routes and middleware

2. **PDF Report Export**:
   - Install: `pnpm add html2pdf`
   - Add download button in report tab

3. **Advanced Visualizations**:
   - Create more Recharts components
   - Add heatmaps, correlation matrices, etc.

4. **Email Notifications**:
   - Integrate SendGrid or Mailgun
   - Send analysis reports via email

5. **Rate Limiting**:
   - Install: `pnpm add @vercel/edge`
   - Add rate limiting middleware

---

## Troubleshooting Common Issues

### Issue: "Cannot find module 'next-themes'"

**Solution**:
```bash
pnpm install next-themes
```

### Issue: "GOOGLE_API_KEY is not set"

**Solution**:
1. Verify `.env.local` exists in project root
2. Check key is formatted correctly
3. Restart dev server: `pnpm dev`
4. Clear browser cache

### Issue: File upload fails

**Solution**:
1. Check file size (max 50MB)
2. Verify file format (CSV, JSON, Excel)
3. Check `public/uploads/` directory exists
4. Look at browser console for errors

### Issue: Insights tab shows loading forever

**Solution**:
1. Check Google API key is valid
2. Check browser Network tab for API errors
3. Check server logs: `pnpm dev` output
4. Try uploading a smaller file first

### Issue: Deployment fails on Vercel

**Solution**:
1. Check all environment variables are set
2. Verify Node.js version compatibility
3. Check build logs in Vercel dashboard
4. Ensure no secrets are in code (only in env vars)

---

## Quick Reference Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run linting

# Dependency management
pnpm install          # Install all dependencies
pnpm add <package>    # Add new package
pnpm remove <package> # Remove package

# Deployment
git push origin main  # Push to GitHub (Vercel auto-deploys)
vercel deploy         # Manual Vercel deploy
```

---

## Final Checklist

- [ ] Step 1: Google API key obtained
- [ ] Step 2: Project cloned/downloaded and dependencies installed
- [ ] Step 3: `.env.local` file created with API key
- [ ] Step 4: Local testing successful
- [ ] Step 5: Database set up (optional)
- [ ] Step 6: Deployed to Vercel (optional)
- [ ] Step 7: Custom domain configured (optional)
- [ ] Step 8: Additional features added (optional)

---

## Support Resources

If you get stuck:

1. **Check SETUP_GUIDE.md** - Comprehensive setup and troubleshooting
2. **Check README.md** - Project overview and documentation
3. **Google Gemini API Docs** - https://ai.google.dev/
4. **Next.js Docs** - https://nextjs.org/docs
5. **Vercel Docs** - https://vercel.com/docs

---

## What's Included in the Project

### Pages (Routes)
- `/` - Home page with feature overview
- `/upload` - File upload page
- `/dashboard` - View all uploaded datasets
- `/analysis/[id]` - Analysis dashboard with 4 tabs
- `/help` - Documentation and help

### Features
- Drag-and-drop file upload
- Data profiling with statistics
- Data quality assessment
- AI-powered insights (requires API key)
- Automated Python cleaning scripts
- Professional reports
- Before/after comparison
- Responsive dark/light theme

### Technologies
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Google Generative AI
- Recharts for visualizations

---

## You're All Set!

Congratulations! You now have a fully functional EDA Assistant application. 

**Next steps**:
1. Complete the checklist above
2. Test the application locally
3. Deploy to Vercel
4. Share with your team or users
5. Collect feedback and iterate

For questions or issues, refer to the detailed guides (SETUP_GUIDE.md, README.md) or the help page in the app itself.

Good luck with your data analysis platform!
