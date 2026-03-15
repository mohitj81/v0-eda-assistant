'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Zap, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Insight {
  category: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  recommendation?: string
}

interface InsightsData {
  summary: string
  insights: Insight[]
  qualityScore: number
  cleaningScript?: string
}

interface InsightsTabProps {
  datasetId: string
}

export function InsightsTab({ datasetId }: InsightsTabProps) {
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/analysis/${datasetId}/insights`)
        
        if (!response.ok) {
          throw new Error('Failed to load insights')
        }

        const data = await response.json()
        setInsightsData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadInsights()
  }, [datasetId])

  const copyCleaningScript = () => {
    if (insightsData?.cleaningScript) {
      navigator.clipboard.writeText(insightsData.cleaningScript)
      setCopied(true)
      toast.success('Cleaning script copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <div>
          <p className="font-semibold">Error Loading Insights</p>
          <p className="text-sm">{error}</p>
        </div>
      </Alert>
    )
  }

  if (!insightsData) {
    return null
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20'
      case 'warning':
        return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20'
      default:
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Quality Score */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">Data Quality Score</h3>
            <div className="text-4xl font-bold">{insightsData.qualityScore}%</div>
            <p className="text-sm text-muted-foreground mt-2">
              {insightsData.qualityScore >= 80
                ? 'Excellent data quality'
                : insightsData.qualityScore >= 60
                ? 'Good data quality, minor issues found'
                : 'Significant data quality issues found'}
            </p>
          </div>
          <div className="text-5xl">
            <Zap className="h-16 w-16 text-primary opacity-30" />
          </div>
        </div>
      </Card>

      {/* AI Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Analysis Summary</h3>
        <p className="text-muted-foreground leading-relaxed">{insightsData.summary}</p>
      </Card>

      {/* Insights List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Key Insights & Findings</h3>
        {insightsData.insights.map((insight, idx) => (
          <Card key={idx} className={`p-6 ${getSeverityColor(insight.severity)}`}>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{insight.title}</h4>
                  <span className="text-xs font-mono px-2 py-1 bg-secondary rounded">
                    {insight.category}
                  </span>
                </div>
                <p className="text-sm mb-3">{insight.description}</p>
                {insight.recommendation && (
                  <div className="bg-background/50 rounded p-3 border border-border">
                    <p className="text-xs font-semibold mb-1">Recommendation:</p>
                    <p className="text-sm">{insight.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Cleaning Script */}
      {insightsData.cleaningScript && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Auto-Generated Cleaning Script</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={copyCleaningScript}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre className="bg-secondary p-4 rounded overflow-x-auto text-sm font-mono">
            {insightsData.cleaningScript}
          </pre>
        </Card>
      )}
    </div>
  )
}
