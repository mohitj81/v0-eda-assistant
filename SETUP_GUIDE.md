# EDA Assistant - Setup Guide

This document outlines all the manual steps required to get the EDA Assistant application fully operational after initial development.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Variables Setup](#environment-variables-setup)
3. [API Keys & Credentials](#api-keys--credentials)
4. [Database Setup (Optional)](#database-setup-optional)
5. [Deployment Steps](#deployment-steps)
6. [Testing the Application](#testing-the-application)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- npm or pnpm package manager
- A code editor (VS Code recommended)
- Git for version control
- A Vercel account (for deployment)

### Local Development Setup

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# The app will be available at http://localhost:3000
```

---

## Environment Variables Setup

### Step 1: Create `.env.local` File

In the root of your project, create a file named `.env.local` and add the following variables:

```env
# Google Generative AI (Gemini API) - REQUIRED FOR AI INSIGHTS
GOOGLE_API_KEY=your_google_api_key_here

# Optional: Database Configuration (if using database)
DATABASE_URL=your_database_url_here

# Optional: File Storage
STORAGE_URL=your_storage_url_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 2: Important Notes on Environment Variables

- **Local Development**: Variables in `.env.local` are automatically loaded by Next.js
- **Production (Vercel)**: You MUST add these variables in your Vercel project settings
- **Never commit** `.env.local` to git (it's in `.gitignore`)
- **Keep variables secret** - especially API keys

---

## API Keys & Credentials

### Required: Google Gemini API Key

The AI insights feature requires a Google Generative AI API key for using Claude/Gemini models.

#### How to Get Your Google API Key:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Select your project (or create a new one)
4. Copy the generated API key
5. Add it to `.env.local`:
   ```env
   GOOGLE_API_KEY=your_copied_key_here
   ```

#### Verify the Key Works:

```bash
# The app will automatically test the key when you use the Insights feature
# If there's an error, check the browser console and server logs
```

### Optional: Database Setup

If you want to persist datasets and analysis history:

#### Option A: Supabase (Recommended)

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Add to `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

#### Option B: Vercel Postgres

1. In Vercel dashboard, go to Storage → Postgres
2. Create a new database
3. Copy the connection string
4. Add to `.env.local`:
   ```env
   DATABASE_URL=your_vercel_postgres_url
   ```

#### Option C: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database
3. Add connection string to `.env.local`

---

## Database Setup (Optional)

If using a database, run migrations:

```bash
# Create tables (you'll need to implement migration scripts)
pnpm run migrate
```

### Database Tables Needed (if implementing):

```sql
-- Datasets table
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  stats JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analysis results table
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id),
  analysis_type VARCHAR(50),
  results JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id),
  report_data JSONB,
  generated_at TIMESTAMP DEFAULT NOW()
);
```

**Note**: Currently, the app stores files in the `public/uploads` directory. For production, consider migrating to cloud storage (S3, Vercel Blob, etc).

---

## Deployment Steps

### Deploy to Vercel (Recommended)

#### Step 1: Prepare Your Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: EDA Assistant"

# Push to GitHub
git push origin main
```

#### Step 2: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework: Next.js
   - Root Directory: ./
   - Build Command: `pnpm run build`
   - Install Command: `pnpm install`

#### Step 3: Add Environment Variables in Vercel

1. In Vercel project settings, go to "Environment Variables"
2. Add all variables from your `.env.local`:

```
GOOGLE_API_KEY = your_api_key_here
DATABASE_URL = your_db_url_here
NODE_ENV = production
```

3. Click "Save"

#### Step 4: Deploy

```bash
# Vercel will automatically deploy on push to main
# Or manually trigger deployment in Vercel dashboard
```

---

## Testing the Application

### Manual Testing Checklist

#### 1. Home Page
- [ ] Visit homepage at `/`
- [ ] See the welcome message and feature overview
- [ ] Verify responsive design on mobile/tablet

#### 2. Data Upload (`/upload`)
- [ ] Drag and drop a CSV file
- [ ] Upload by clicking the upload area
- [ ] Verify file validation (size, type)
- [ ] Confirm redirect to analysis page after upload

#### 3. Analysis Dashboard (`/analysis/[id]`)
- [ ] Page loads dataset information
- [ ] Profile tab shows column statistics
- [ ] Insights tab displays data quality score and insights
- [ ] Report tab generates a summary report
- [ ] Comparison tab shows before/after (if applicable)

#### 4. Dashboard (`/dashboard`)
- [ ] Shows list of uploaded datasets
- [ ] Dataset cards display metadata
- [ ] Can navigate to individual analyses

#### 5. Help Page (`/help`)
- [ ] Documentation loads correctly
- [ ] Links are functional

### Automated Testing

To add unit tests:

```bash
# Install testing libraries
pnpm add -D jest @testing-library/react @testing-library/jest-dom

# Run tests
pnpm test
```

---

## Troubleshooting

### Issue: "GOOGLE_API_KEY is not set"

**Solution:**
1. Check `.env.local` has `GOOGLE_API_KEY`
2. Restart development server after adding the variable
3. In Vercel, ensure the variable is added in project settings
4. Verify no extra spaces in the key

### Issue: Files Not Saving

**Solution:**
1. Check `public/uploads` directory exists and is writable
2. Verify file size is under 50MB
3. Check file format is CSV, JSON, or Excel
4. Look at server logs for detailed error messages

### Issue: Insights Not Loading

**Solution:**
1. Verify `GOOGLE_API_KEY` is correct
2. Check API quota in Google Cloud Console
3. Look at browser Network tab to see API response
4. Check server logs for error details

### Issue: Analysis Page Blank

**Solution:**
1. Ensure file was uploaded successfully
2. Check if dataset ID in URL matches uploaded file
3. Check browser console for JavaScript errors
4. Verify API endpoints are responding

### Issue: Deployment Fails

**Solution:**
1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Verify no secrets in code (only in env vars)
4. Check Node.js version compatibility (need 18+)

---

## Performance Optimization Tips

1. **File Upload Size**: Currently max 50MB. For larger files, consider streaming or chunked uploads
2. **Analysis Performance**: For datasets with 100k+ rows, consider implementing pagination or sampling
3. **Caching**: Add SWR cache revalidation for frequently accessed data
4. **Database Indexing**: If using database, index commonly queried fields

---

## Security Considerations

1. **API Keys**: Never commit API keys to git
2. **File Uploads**: Implement file type validation on both client and server
3. **Rate Limiting**: Add rate limiting to API endpoints (especially file upload and insights)
4. **CORS**: Configure CORS if accessing from different domain
5. **Input Validation**: All file data is parsed safely, but validate user inputs further if needed

---

## Next Steps for Enhancement

1. **Database Integration**: Persist datasets and analyses in a database
2. **User Authentication**: Add Supabase Auth or Auth0 for user accounts
3. **Advanced Visualizations**: Add more chart types with Recharts
4. **Report Export**: Generate PDF reports using libraries like html2pdf or puppeteer
5. **Real-time Collaboration**: Add WebSocket support for collaborative analysis
6. **Machine Learning Integration**: Add sklearn recommendations for ML models
7. **Batch Processing**: Handle multiple file uploads and analysis
8. **Data Cleaning Scripts**: Generate language-specific cleaning scripts (Python, R, SQL)

---

## Support & Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Google Generative AI**: https://ai.google.dev/
- **Vercel Documentation**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com/

---

## Frequently Asked Questions

**Q: Can I use this without the AI insights?**
A: Yes! The application works fine without API keys. The insights feature will show a message if the key is missing.

**Q: How long are uploaded files stored?**
A: Currently, files are stored in `public/uploads` indefinitely. For production, implement file expiration or cloud storage with lifecycle policies.

**Q: Can I upload data with 1+ million rows?**
A: The current implementation handles large files but may be slow. For enterprise use, implement streaming or database-backed storage.

**Q: Is there a mobile app?**
A: The web app is responsive and works on mobile devices. A native mobile app can be built using React Native or Flutter in the future.

**Q: How do I add more analysis features?**
A: Create new components in `/components/analysis/` and new API routes in `/app/api/analysis/`.

---

## Checklist: Before Going to Production

- [ ] Environment variables configured in Vercel
- [ ] Google API key added and tested
- [ ] Database set up (if using)
- [ ] File storage configured for production
- [ ] Rate limiting implemented on API endpoints
- [ ] Error handling and logging in place
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Documentation updated
- [ ] Backup and disaster recovery plan
- [ ] Monitoring and alerts configured
- [ ] HTTPS enabled (automatic with Vercel)

---

**Last Updated**: March 2025
**Version**: 1.0
