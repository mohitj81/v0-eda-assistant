'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

interface ColumnProfile {
  name: string
  type: string
  missing: number
  missingPct: number
  unique: number
  duplicates: number
  stats?: {
    mean?: number
    median?: number
    std?: number
    min?: number
    max?: number
    q1?: number
    q3?: number
  }
  topValues?: Array<{ value: string; count: number }>
}

interface ProfileData {
  columns: ColumnProfile[]
  rowCount: number
  columnCount: number
  missingTotal: number
  duplicateRows: number
}

interface ProfileTabProps {
  datasetId: string
}

export function ProfileTab({ datasetId }: ProfileTabProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedColumn, setSelectedColumn] = useState<ColumnProfile | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/analysis/${datasetId}/profile`)
        
        if (!response.ok) {
          throw new Error('Failed to load profile')
        }

        const data = await response.json()
        setProfileData(data)
        if (data.columns.length > 0) {
          setSelectedColumn(data.columns[0])
        }
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [datasetId])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <div>
          <p className="font-semibold">Error Loading Profile</p>
          <p className="text-sm">{error}</p>
        </div>
      </Alert>
    )
  }

  if (!profileData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Columns</div>
          <div className="text-2xl font-bold mt-2">{profileData.columnCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Rows</div>
          <div className="text-2xl font-bold mt-2">{profileData.rowCount.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Missing Values</div>
          <div className="text-2xl font-bold mt-2 text-orange-500">{profileData.missingTotal}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Duplicate Rows</div>
          <div className="text-2xl font-bold mt-2 text-red-500">{profileData.duplicateRows}</div>
        </Card>
      </div>

      {/* Column Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Column Analysis</h3>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Column Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-center py-3 px-4 font-semibold">Missing</th>
                    <th className="text-center py-3 px-4 font-semibold">Unique</th>
                    <th className="text-center py-3 px-4 font-semibold">Duplicates</th>
                  </tr>
                </thead>
                <tbody>
                  {profileData.columns.map((col) => (
                    <tr
                      key={col.name}
                      className="border-b border-border hover:bg-secondary/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedColumn(col)}
                    >
                      <td className="py-3 px-4">{col.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                          {col.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {col.missing > 0 && (
                          <span className="text-orange-500">{col.missing}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">{col.unique}</td>
                      <td className="py-3 px-4 text-center">
                        {col.duplicates > 0 && (
                          <span className="text-red-500">{col.duplicates}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="mt-4">
            {selectedColumn && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-4">{selectedColumn.name} - Distribution</h4>
                  
                  {selectedColumn.topValues && selectedColumn.topValues.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={selectedColumn.topValues}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="value" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                          }}
                        />
                        <Bar dataKey="count" fill="var(--color-primary)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {selectedColumn.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedColumn.stats.mean !== undefined && (
                      <Card className="p-4">
                        <div className="text-xs text-muted-foreground">Mean</div>
                        <div className="text-lg font-semibold mt-1">
                          {selectedColumn.stats.mean.toFixed(2)}
                        </div>
                      </Card>
                    )}
                    {selectedColumn.stats.median !== undefined && (
                      <Card className="p-4">
                        <div className="text-xs text-muted-foreground">Median</div>
                        <div className="text-lg font-semibold mt-1">
                          {selectedColumn.stats.median.toFixed(2)}
                        </div>
                      </Card>
                    )}
                    {selectedColumn.stats.std !== undefined && (
                      <Card className="p-4">
                        <div className="text-xs text-muted-foreground">Std Dev</div>
                        <div className="text-lg font-semibold mt-1">
                          {selectedColumn.stats.std.toFixed(2)}
                        </div>
                      </Card>
                    )}
                    {selectedColumn.stats.min !== undefined && (
                      <Card className="p-4">
                        <div className="text-xs text-muted-foreground">Min</div>
                        <div className="text-lg font-semibold mt-1">
                          {selectedColumn.stats.min.toFixed(2)}
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
