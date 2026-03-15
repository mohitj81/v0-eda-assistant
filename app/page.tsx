'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, BarChart3, Zap, FileText } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-accent-foreground" />
              </div>
              <h1 className="text-xl font-semibold">EDA Assistant</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/help" className="text-sm hover:text-primary transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-pretty">
            Professional Data Analysis at Your Fingertips
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Upload your dataset and get instant AI-powered insights, data profiling, quality assessment, and automated cleaning scripts. Transform raw data into actionable intelligence.
          </p>
          <Link href="/upload">
            <Button size="lg" className="gap-2">
              <Upload className="h-5 w-5" />
              Start Analysis
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 hover:bg-secondary/50 transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Easy Upload</h3>
            <p className="text-sm text-muted-foreground">
              Upload CSV, JSON, or Excel files with automatic format detection
            </p>
          </Card>

          <Card className="p-6 hover:bg-secondary/50 transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Data Profiling</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive statistics, distributions, and data quality metrics
            </p>
          </Card>

          <Card className="p-6 hover:bg-secondary/50 transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">AI Insights</h3>
            <p className="text-sm text-muted-foreground">
              Powered by Google Gemini for intelligent recommendations
            </p>
          </Card>

          <Card className="p-6 hover:bg-secondary/50 transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Export Reports</h3>
            <p className="text-sm text-muted-foreground">
              Generate professional reports and cleaning scripts
            </p>
          </Card>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">Real Data</div>
            <p className="text-muted-foreground mt-2">Zero demo data. Your data only.</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">AI-Powered</div>
            <p className="text-muted-foreground mt-2">Google Gemini integration for insights</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">Professional</div>
            <p className="text-muted-foreground mt-2">Enterprise-grade quality analysis</p>
          </div>
        </div>
      </div>
    </main>
  )
}
