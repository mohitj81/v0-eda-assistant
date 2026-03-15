'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm hover:text-primary transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Help & Documentation</h1>

        <div className="space-y-6">
          {/* Getting Started */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-3">Getting Started</h2>
            <ol className="space-y-2 text-muted-foreground list-decimal ml-4">
              <li>Upload your dataset (CSV, JSON, or Excel)</li>
              <li>The system will automatically analyze your data</li>
              <li>Review the data profile, quality metrics, and insights</li>
              <li>Generate a professional report or download cleaning scripts</li>
            </ol>
          </Card>

          {/* Supported File Formats */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-3">Supported File Formats</h2>
            <ul className="space-y-2 text-muted-foreground list-disc ml-4">
              <li>
                <strong>CSV</strong> - Comma-separated values
              </li>
              <li>
                <strong>JSON</strong> - JavaScript Object Notation
              </li>
              <li>
                <strong>Excel</strong> - .xlsx and .xls files
              </li>
              <li>
                <strong>Maximum size:</strong> 50MB per file
              </li>
            </ul>
          </Card>

          {/* Analysis Features */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-3">Analysis Features</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Data Profiling</h3>
                <p className="text-muted-foreground">
                  Comprehensive statistics for each column including mean, median, standard deviation, and value distributions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Quality Assessment</h3>
                <p className="text-muted-foreground">
                  Automatic detection of missing values, duplicates, data type mismatches, and other quality issues.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI-Powered Insights</h3>
                <p className="text-muted-foreground">
                  Google Gemini analyzes your data to provide intelligent recommendations and identify patterns.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Automated Cleaning Scripts</h3>
                <p className="text-muted-foreground">
                  Get ready-to-use Python code for data cleaning based on identified issues.
                </p>
              </div>
            </div>
          </Card>

          {/* FAQ */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-3">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Is my data private?</h3>
                <p className="text-muted-foreground">
                  Yes, your data is only used for analysis on your current session. We do not store or share your data.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Can I download the cleaned dataset?</h3>
                <p className="text-muted-foreground">
                  We provide Python scripts and recommendations. You can apply these to your own data using the provided code.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">What happens with large files?</h3>
                <p className="text-muted-foreground">
                  Files up to 50MB are supported. For larger files, consider splitting the data into multiple uploads.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">How long does analysis take?</h3>
                <p className="text-muted-foreground">
                  Most datasets are analyzed within seconds. Larger datasets with complex patterns may take a minute or two.
                </p>
              </div>
            </div>
          </Card>

          {/* Contact */}
          <Card className="p-6 bg-primary/5">
            <h2 className="text-xl font-semibold mb-3">Need More Help?</h2>
            <p className="text-muted-foreground mb-4">
              For additional support or feature requests, please reach out to our team.
            </p>
            <Button asChild>
              <a href="mailto:support@edaassistant.com">Contact Support</a>
            </Button>
          </Card>
        </div>
      </div>
    </main>
  )
}
