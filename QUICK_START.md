# EDA Assistant - Quick Start Guide (5 Minutes)

Get your EDA Assistant running in just 5 minutes!

---

## The 4-Step Quick Start

### Step 1: Get API Key (2 minutes)

```
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Save it somewhere safe
```

### Step 2: Add Environment Variable (1 minute)

Create a file named `.env.local` in the project root:

```env
GOOGLE_API_KEY=paste_your_key_here
```

Just paste your API key, nothing else needed for now.

### Step 3: Start Development Server (1 minute)

```bash
pnpm dev
```

The app opens at: `http://localhost:3000`

### Step 4: Test It (1 minute)

1. Click "Upload Data" button
2. Drag and drop a CSV file (or click to browse)
3. Wait for upload to complete
4. Explore the analysis dashboard!

**Done!** You now have a working EDA Assistant.

---

## What Each Page Does

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Overview and quick start |
| Upload | `/upload` | Upload CSV/JSON/Excel files |
| Dashboard | `/dashboard` | See all your datasets |
| Analysis | `/analysis/[id]` | Detailed analysis with insights |
| Help | `/help` | Documentation and help |

---

## Common Commands

```bash
# Start development
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Check for errors
pnpm lint
```

---

## Next: Deploy to Vercel (10 minutes)

Want to deploy live? It's easy:

```bash
# 1. Push to GitHub
git add .
git commit -m "EDA Assistant ready"
git push origin main

# 2. Go to Vercel (https://vercel.com/dashboard)
# 3. Click "Add New" → "Project"
# 4. Import your GitHub repo
# 5. Add GOOGLE_API_KEY in Environment Variables
# 6. Click Deploy
```

Your app is live! Vercel gives you a URL like: `https://your-app.vercel.app`

---

## Troubleshooting

### "API key not working"
- Verify it's pasted correctly in `.env.local`
- Restart dev server after adding
- Check at: https://console.cloud.google.com/apis/enabled

### "File upload fails"
- Check file is CSV, JSON, or Excel
- Check file is under 50MB
- Look at browser console (F12) for errors

### "Insights tab loading forever"
- Check API key is valid
- Check internet connection
- Try a different/smaller file

### "Module not found errors"
```bash
# Reinstall dependencies
pnpm install
```

---

## File Locations

- **Config**: `.env.local` (create this)
- **App Code**: `app/` folder
- **Components**: `components/` folder
- **API**: `app/api/` folder
- **Docs**: `*.md` files in root

---

## Documentation

For detailed information:

- **Setup**: `SETUP_GUIDE.md`
- **Manual Steps**: `MANUAL_SETUP_CHECKLIST.md`
- **Full Overview**: `README.md`
- **Project Status**: `PROJECT_COMPLETE.md`

---

## Sample Data to Test With

Create a simple `test.csv` file:

```csv
name,age,salary,department
Alice,28,65000,Sales
Bob,34,75000,Engineering
Charlie,29,68000,Sales
Diana,31,72000,Engineering
Eve,26,60000,HR
```

Upload this file and explore the analysis!

---

## That's It!

You have a fully functional EDA Assistant. Read more docs if you want to customize, deploy, or add features.

**Happy analyzing!**

---

For more details, see the full documentation files in the project root.
