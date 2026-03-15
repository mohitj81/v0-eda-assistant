'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'

interface ColumnProfile {
  name: string
  type: string
  missing: number
  missingPct: number
  unique: number
  duplicates?: number
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

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <span className="font-medium">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
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
        if (!response.ok) throw new Error('Failed to load profile')
        const data = await response.json()
        setProfileData(data)
        if (data.columns?.length > 0) setSelectedColumn(data.columns[0])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [datasetId])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
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

  if (!profileData) return null

  // Chart data
  const missingBarData = profileData.columns
    .filter((c) => c.missing > 0)
    .sort((a, b) => b.missing - a.missing)
    .slice(0, 15)
    .map((c) => ({
      name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
      fullName: c.name,
      missing: c.missing,
      pct: typeof c.missingPct === 'number' ? parseFloat(c.missingPct.toFixed(1)) : 0,
    }))

  const typeCount: Record<string, number> = {}
  profileData.columns.forEach((c) => {
    const t = c.type || 'unknown'
    typeCount[t] = (typeCount[t] || 0) + 1
  })
  const typePieData = Object.entries(typeCount).map(([name, value]) => ({ name, value }))

  const completenessData = profileData.columns.map((c) => ({
    name: c.name.length > 10 ? c.name.slice(0, 10) + '…' : c.name,
    fullName: c.name,
    complete: parseFloat((100 - (typeof c.missingPct === 'number' ? c.missingPct : 0)).toFixed(1)),
    missing: typeof c.missingPct === 'number' ? parseFloat(c.missingPct.toFixed(1)) : 0,
  }))

  const numericColumns = profileData.columns.filter(
    (c) => c.type === 'numeric' || c.type === 'integer' || c.type === 'float'
  )

  const uniquenessData = profileData.columns
    .slice(0, 12)
    .map((c) => ({
      name: c.name.length > 10 ? c.name.slice(0, 10) + '…' : c.name,
      fullName: c.name,
      uniqueness: profileData.rowCount > 0
        ? parseFloat(((c.unique / profileData.rowCount) * 100).toFixed(1))
        : 0,
      unique: c.unique,
    }))

  const overallCompleteness = profileData.rowCount > 0 && profileData.columnCount > 0
    ? (100 - (profileData.missingTotal / (profileData.rowCount * profileData.columnCount)) * 100).toFixed(1)
    : '100'

  return (
    <div className="space-y-6">

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Rows</div>
          <div className="text-3xl font-bold">{profileData.rowCount.toLocaleString()}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Columns</div>
          <div className="text-3xl font-bold">{profileData.columnCount}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Missing Values</div>
          <div className={`text-3xl font-bold ${profileData.missingTotal > 0 ? 'text-orange-500' : 'text-green-500'}`}>
            {profileData.missingTotal.toLocaleString()}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Completeness</div>
          <div className={`text-3xl font-bold ${parseFloat(overallCompleteness) >= 95 ? 'text-green-500' : 'text-orange-500'}`}>
            {overallCompleteness}%
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="missing">Missing</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="completeness">Completeness</TabsTrigger>
        </TabsList>

        {/* TAB 1 — Column Overview Table */}
        <TabsContent value="overview" className="mt-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">All Columns</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-3 font-semibold">#</th>
                    <th className="text-left py-3 px-3 font-semibold">Column</th>
                    <th className="text-left py-3 px-3 font-semibold">Type</th>
                    <th className="text-right py-3 px-3 font-semibold">Missing</th>
                    <th className="text-right py-3 px-3 font-semibold">Missing %</th>
                    <th className="text-right py-3 px-3 font-semibold">Unique</th>
                    <th className="text-right py-3 px-3 font-semibold">Mean</th>
                    <th className="text-right py-3 px-3 font-semibold">Min</th>
                    <th className="text-right py-3 px-3 font-semibold">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {profileData.columns.map((col, idx) => (
                    <tr
                      key={col.name}
                      className={`border-b hover:bg-muted/40 cursor-pointer transition-colors ${selectedColumn?.name === col.name ? 'bg-muted/60' : ''}`}
                      onClick={() => setSelectedColumn(col)}
                    >
                      <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium">{col.name}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs font-mono">{col.type}</Badge>
                      </td>
                      <td className={`py-2 px-3 text-right ${col.missing > 0 ? 'text-orange-500 font-medium' : 'text-green-500'}`}>
                        {col.missing}
                      </td>
                      <td className={`py-2 px-3 text-right ${(typeof col.missingPct === 'number' ? col.missingPct : 0) > 10 ? 'text-red-500' : ''}`}>
                        {typeof col.missingPct === 'number' ? col.missingPct.toFixed(1) : '0'}%
                      </td>
                      <td className="py-2 px-3 text-right">{col.unique}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        {col.stats?.mean !== undefined ? col.stats.mean.toFixed(2) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        {col.stats?.min !== undefined ? col.stats.min.toFixed(2) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        {col.stats?.max !== undefined ? col.stats.max.toFixed(2) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2 — Missing Values */}
        <TabsContent value="missing" className="mt-4 space-y-6">
          {missingBarData.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-green-600">No Missing Values</p>
              <p className="text-sm text-muted-foreground mt-1">Your dataset is complete!</p>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <h3 className="font-semibold mb-1">Missing Values by Column</h3>
                <p className="text-xs text-muted-foreground mb-4">Number of missing values per column</p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={missingBarData} margin={{ top: 5, right: 20, bottom: 60, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="missing" name="Missing Count" radius={[4, 4, 0, 0]}>
                      {missingBarData.map((_, i) => (
                        <Cell key={i} fill={`hsl(${0 + i * 15}, 80%, 55%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-1">Missing % by Column</h3>
                <p className="text-xs text-muted-foreground mb-4">Percentage of missing values — columns over 10% need attention</p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={missingBarData} margin={{ top: 5, right: 20, bottom: 60, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                    <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="pct" name="Missing %" radius={[4, 4, 0, 0]}>
                      {missingBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.pct > 30 ? '#ef4444' : entry.pct > 10 ? '#f59e0b' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Under 10% — minor</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" /> 10–30% — moderate</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Over 30% — critical</span>
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB 3 — Data Types */}
        <TabsContent value="types" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Column Types Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={typePieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typePieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Column Type Summary</h3>
              <div className="space-y-3">
                {typePieData.map((type, i) => (
                  <div key={type.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium capitalize">{type.name}</span>
                        <span className="text-muted-foreground">{type.value} columns</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(type.value / profileData.columnCount) * 100}%`,
                            background: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Numeric columns</span>
                  <span className="font-medium">{numericColumns.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categorical columns</span>
                  <span className="font-medium">{profileData.columns.filter(c => c.type === 'categorical' || c.type === 'string').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total columns</span>
                  <span className="font-medium">{profileData.columnCount}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Uniqueness chart */}
          <Card className="p-6">
            <h3 className="font-semibold mb-1">Column Uniqueness</h3>
            <p className="text-xs text-muted-foreground mb-4">
              % of unique values per column — 100% may indicate ID columns, low % suggests categorical
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={uniquenessData} margin={{ top: 5, right: 20, bottom: 60, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="uniqueness" name="Uniqueness %" radius={[4, 4, 0, 0]}>
                  {uniquenessData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.uniqueness > 90 ? '#8b5cf6' : entry.uniqueness > 50 ? '#3b82f6' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* TAB 4 — Distribution */}
        <TabsContent value="distribution" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            {profileData.columns.map((col) => (
              <button
                key={col.name}
                onClick={() => setSelectedColumn(col)}
                className={`text-left p-3 rounded-lg border text-sm transition-all ${
                  selectedColumn?.name === col.name
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <p className="font-medium truncate">{col.name}</p>
                <Badge variant="outline" className="text-xs mt-1">{col.type}</Badge>
              </button>
            ))}
          </div>

          {selectedColumn && (
            <Card className="p-6">
              <h3 className="font-semibold mb-1">{selectedColumn.name}</h3>
              <Badge variant="outline" className="mb-4">{selectedColumn.type}</Badge>

              {/* Stats row */}
              {selectedColumn.stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {[
                    { label: 'Mean', val: selectedColumn.stats.mean },
                    { label: 'Median', val: selectedColumn.stats.median },
                    { label: 'Std Dev', val: selectedColumn.stats.std },
                    { label: 'Min', val: selectedColumn.stats.min },
                    { label: 'Max', val: selectedColumn.stats.max },
                  ].map(({ label, val }) => val !== undefined && (
                    <div key={label} className="bg-muted/30 rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="font-bold mt-1">{val.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Top values chart */}
              {selectedColumn.topValues && selectedColumn.topValues.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Top values</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={selectedColumn.topValues.slice(0, 12)}
                      margin={{ top: 5, right: 20, bottom: 60, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="value"
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                        {selectedColumn.topValues.slice(0, 12).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* IQR box plot info */}
              {selectedColumn.stats?.q1 !== undefined && selectedColumn.stats?.q3 !== undefined && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Box Plot Summary</p>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    {[
                      { label: 'Min', val: selectedColumn.stats.min },
                      { label: 'Q1 (25%)', val: selectedColumn.stats.q1 },
                      { label: 'Median', val: selectedColumn.stats.median },
                      { label: 'Q3 (75%)', val: selectedColumn.stats.q3 },
                      { label: 'Max', val: selectedColumn.stats.max },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-background rounded p-2">
                        <div className="text-muted-foreground">{label}</div>
                        <div className="font-bold mt-1">{val !== undefined ? val.toFixed(2) : '—'}</div>
                      </div>
                    ))}
                  </div>
                  {selectedColumn.stats.q1 !== undefined && selectedColumn.stats.q3 !== undefined && (
                    <p className="text-xs text-muted-foreground mt-2">
                      IQR: {(selectedColumn.stats.q3 - selectedColumn.stats.q1).toFixed(2)} &nbsp;|&nbsp;
                      Outlier bounds: [{(selectedColumn.stats.q1 - 1.5 * (selectedColumn.stats.q3 - selectedColumn.stats.q1)).toFixed(2)},
                      {(selectedColumn.stats.q3 + 1.5 * (selectedColumn.stats.q3 - selectedColumn.stats.q1)).toFixed(2)}]
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        {/* TAB 5 — Completeness */}
        <TabsContent value="completeness" className="mt-4 space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-1">Column Completeness</h3>
            <p className="text-xs text-muted-foreground mb-4">
              % of non-missing values per column — 100% is fully complete
            </p>
            <ResponsiveContainer width="100%" height={Math.max(300, profileData.columns.length * 28)}>
              <BarChart
                data={completenessData}
                layout="vertical"
                margin={{ top: 5, right: 40, bottom: 5, left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={95} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="complete" name="Complete %" radius={[0, 4, 4, 0]}>
                  {completenessData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.complete === 100 ? '#10b981' : entry.complete >= 90 ? '#3b82f6' : entry.complete >= 70 ? '#f59e0b' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> 100% complete</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> 90–99%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" /> 70–89%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Under 70%</span>
            </div>
          </Card>

          {/* Overall completeness summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 text-center">
              <div className="text-3xl font-bold text-green-500">
                {profileData.columns.filter(c => c.missing === 0).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Fully Complete Columns</div>
            </Card>
            <Card className="p-5 text-center">
              <div className="text-3xl font-bold text-orange-500">
                {profileData.columns.filter(c => c.missing > 0 && (typeof c.missingPct === 'number' ? c.missingPct : 0) < 30).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Minor Missing Columns</div>
            </Card>
            <Card className="p-5 text-center">
              <div className="text-3xl font-bold text-red-500">
                {profileData.columns.filter(c => (typeof c.missingPct === 'number' ? c.missingPct : 0) >= 30).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Critical Missing Columns</div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}