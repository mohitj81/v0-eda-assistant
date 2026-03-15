'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Download, Loader2, AlertCircle } from 'lucide-react'
import { ProfileTab } from '@/components/analysis/profile-tab'
import { InsightsTab } from '@/components/analysis/insights-tab'
import { ComparisonTab } from '@/components/analysis/comparison-tab'
import { ReportTab } from '@/components/analysis/report-tab'

interface DatasetInfo {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  stats?: {
    rows: number
    columns: number
    missingValues: number
    duplicates: number
  }
}

export default function AnalysisPage() {
  const params = useParams()
  const datasetId = params.id as string
  const [dataset, setDataset] = useState<DatasetInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    const loadDataset = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/analysis/${datasetId}`)
        
        if (!response.ok) {
          throw new Error('Failed to load dataset')
        }

        const data = await response.json()
        setDataset(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    if (datasetId) {
      loadDataset()
    }
  }, [datasetId])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 text-sm hover:text-primary transition-colors w-fit">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/">New Analysis</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-semibold">Error Loading Dataset</p>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        {dataset && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{dataset.fileName}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Uploaded: {new Date(dataset.uploadedAt).toLocaleDateString()}</span>
                <span>Size: {(dataset.fileSize / 1024).toFixed(2)} KB</span>
                {dataset.stats && (
                  <>
                    <span>Rows: {dataset.stats.rows.toLocaleString()}</span>
                    <span>Columns: {dataset.stats.columns}</span>
                  </>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            {dataset.stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="p-6">
                  <div className="text-sm text-muted-foreground mb-1">Total Rows</div>
                  <div className="text-2xl font-bold">{dataset.stats.rows.toLocaleString()}</div>
                </Card>
                <Card className="p-6">
                  <div className="text-sm text-muted-foreground mb-1">Total Columns</div>
                  <div className="text-2xl font-bold">{dataset.stats.columns}</div>
                </Card>
                <Card className="p-6">
                  <div className="text-sm text-muted-foreground mb-1">Missing Values</div>
                  <div className="text-2xl font-bold text-orange-500">{dataset.stats.missingValues}</div>
                </Card>
                <Card className="p-6">
                  <div className="text-sm text-muted-foreground mb-1">Duplicates</div>
                  <div className="text-2xl font-bold text-red-500">{dataset.stats.duplicates}</div>
                </Card>
              </div>
            )}

            {/* Analysis Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="report">Report</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-6">
                <ProfileTab datasetId={datasetId} />
              </TabsContent>

              <TabsContent value="insights" className="mt-6">
                <InsightsTab datasetId={datasetId} />
              </TabsContent>

              <TabsContent value="comparison" className="mt-6">
                <ComparisonTab datasetId={datasetId} />
              </TabsContent>

              <TabsContent value="report" className="mt-6">
                <ReportTab datasetId={datasetId} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </main>
  )
}
