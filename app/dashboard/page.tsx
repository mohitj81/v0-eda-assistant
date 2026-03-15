'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import { ArrowLeft, Plus, BarChart3 } from 'lucide-react'

export default function DashboardPage() {
  // Mock recent datasets
  const recentDatasets = [
    {
      id: 'dataset_1234567890',
      name: 'customer_data.csv',
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      rowCount: 1500,
      columnCount: 12,
      qualityScore: 85,
    },
    {
      id: 'dataset_1234567891',
      name: 'sales_2024.xlsx',
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      rowCount: 3200,
      columnCount: 8,
      qualityScore: 78,
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2 hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back to Home</span>
              </Link>
            </div>
            <Button asChild gap={2}>
              <Link href="/upload">
                <Plus className="h-4 w-4" />
                New Analysis
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            View your recent analyses and manage your datasets
          </p>
        </div>

        {recentDatasets.length === 0 ? (
          <Empty
            title="No datasets yet"
            description="Start by uploading your first dataset for analysis"
            action={
              <Button asChild>
                <Link href="/upload">Upload Dataset</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            {recentDatasets.map((dataset) => (
              <Link key={dataset.id} href={`/analysis/${dataset.id}`}>
                <Card className="p-6 hover:bg-secondary/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{dataset.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {dataset.rowCount.toLocaleString()} rows × {dataset.columnCount} columns
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{dataset.qualityScore}%</div>
                      <p className="text-xs text-muted-foreground">Quality Score</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dataset.uploadedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
