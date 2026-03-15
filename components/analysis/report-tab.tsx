'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Download, FileText, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ReportTabProps {
  datasetId: string
}

export function ReportTab({ datasetId }: ReportTabProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportUrl, setReportUrl] = useState<string | null>(null)

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true)
      const response = await fetch(`/api/analysis/${datasetId}/report`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const data = await response.json()
      setReportUrl(data.reportUrl)
      toast.success('Report generated successfully')
    } catch (error) {
      toast.error('Failed to generate report')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Professional Report</h3>
        <p className="text-muted-foreground mb-6">
          Generate a comprehensive PDF report with all analysis, insights, and recommendations.
        </p>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <div>
            <p className="font-semibold">Report Includes</p>
            <ul className="text-sm mt-2 space-y-1 ml-4 list-disc">
              <li>Dataset overview and statistics</li>
              <li>Data quality assessment and score</li>
              <li>AI-powered insights and findings</li>
              <li>Automated cleaning recommendations</li>
              <li>Column-by-column analysis</li>
            </ul>
          </div>
        </Alert>

        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          size="lg"
          className="gap-2"
        >
          {isGenerating && <Loader2 className="h-5 w-5 animate-spin" />}
          {isGenerating ? 'Generating...' : 'Generate PDF Report'}
        </Button>
      </Card>

      {reportUrl && (
        <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-semibold">Report Ready</p>
                <p className="text-sm text-muted-foreground">Your PDF report is ready for download</p>
              </div>
            </div>
            <Button asChild>
              <a href={reportUrl} download>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        </Card>
      )}

      {/* Sample Report Preview */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Report Preview</h4>
        <div className="bg-secondary/30 rounded p-8 space-y-4 text-sm">
          <div>
            <h5 className="font-semibold mb-2">Executive Summary</h5>
            <p className="text-muted-foreground">
              Your report will contain a comprehensive analysis of your dataset including:
            </p>
          </div>
          <div>
            <h5 className="font-semibold mb-2">Key Metrics</h5>
            <ul className="text-muted-foreground list-disc ml-4 space-y-1">
              <li>Total rows and columns</li>
              <li>Missing values analysis</li>
              <li>Duplicate detection</li>
              <li>Data type breakdown</li>
              <li>Statistical summaries</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold mb-2">Insights & Recommendations</h5>
            <ul className="text-muted-foreground list-disc ml-4 space-y-1">
              <li>AI-powered findings from Gemini API</li>
              <li>Data quality issues and solutions</li>
              <li>Automated cleaning recommendations</li>
              <li>Python code snippets for implementation</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
