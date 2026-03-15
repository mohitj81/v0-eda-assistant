'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ComparisonTabProps {
  datasetId: string
}

export function ComparisonTab({ datasetId }: ComparisonTabProps) {
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Before & After Comparison</h3>
        <p className="text-muted-foreground mb-6">
          Upload a cleaned version of your dataset to compare quality metrics and see the improvements from our cleaning recommendations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <div>
            <h4 className="font-semibold mb-3">Original Dataset</h4>
            <Card className="p-6 border-2 border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground mb-4">Using current dataset</p>
              <div className="h-48 flex items-center justify-center bg-secondary/30 rounded">
                <span className="text-xs text-muted-foreground">Original data loaded</span>
              </div>
            </Card>
          </div>

          {/* After */}
          <div>
            <h4 className="font-semibold mb-3">Cleaned Dataset</h4>
            <Card className="p-6 border-2 border-dashed border-border text-center">
              <input
                type="file"
                accept=".csv,.json,.xlsx"
                onChange={(e) => setAfterFile(e.target.files?.[0] || null)}
                className="hidden"
                id="after-file"
              />
              <label htmlFor="after-file" className="cursor-pointer block">
                <p className="text-sm text-muted-foreground mb-4">Upload cleaned version</p>
                <div className="h-48 flex items-center justify-center bg-secondary/30 rounded hover:bg-secondary/50 transition-colors">
                  {afterFile ? (
                    <span className="text-sm">{afterFile.name}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Click or drag file</span>
                  )}
                </div>
              </label>
            </Card>
          </div>
        </div>

        {/* Comparison Metrics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Missing Values Reduction</div>
            <div className="text-2xl font-bold text-green-500">TBD</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Duplicates Removed</div>
            <div className="text-2xl font-bold text-green-500">TBD</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Quality Improvement</div>
            <div className="text-2xl font-bold text-green-500">TBD</div>
          </Card>
        </div>
      </Card>
    </div>
  )
}
