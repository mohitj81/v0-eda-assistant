'use client'

import { FileText, BarChart3, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DatasetCardProps {
  id: string
  fileName: string
  uploadedAt: string
  stats: {
    rows: number
    columns: number
    missingValues?: number
    duplicates?: number
  }
}

export function DatasetCard({ id, fileName, uploadedAt, stats }: DatasetCardProps) {
  const uploadDate = new Date(uploadedAt)
  const formattedDate = uploadDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base">{fileName}</CardTitle>
              <CardDescription className="text-xs">{formattedDate}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Rows</p>
            <p className="text-lg font-semibold">{stats.rows.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Columns</p>
            <p className="text-lg font-semibold">{stats.columns}</p>
          </div>
          {stats.missingValues !== undefined && stats.missingValues > 0 && (
            <div className="rounded-lg bg-yellow-50 p-3">
              <p className="text-xs text-yellow-700">Missing Values</p>
              <p className="text-lg font-semibold text-yellow-900">{stats.missingValues}</p>
            </div>
          )}
          {stats.duplicates !== undefined && stats.duplicates > 0 && (
            <div className="rounded-lg bg-orange-50 p-3">
              <p className="text-xs text-orange-700">Duplicates</p>
              <p className="text-lg font-semibold text-orange-900">{stats.duplicates}</p>
            </div>
          )}
        </div>

        <Link href={`/analysis/${id}`} className="block">
          <Button className="w-full gap-2" variant="default">
            <BarChart3 className="h-4 w-4" />
            Analyze Dataset
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
