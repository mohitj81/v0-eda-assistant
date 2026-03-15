'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Upload, CheckCircle, TrendingDown, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface ColumnComparison {
  name: string
  type: string
  missingBefore: number
  missingAfter: number
  missingPctBefore: string
  missingPctAfter: string
  improvement: number
}

interface ComparisonResult {
  rowsBefore: number
  rowsAfter: number
  colsBefore: number
  colsAfter: number
  missingBefore: number
  missingAfter: number
  missingRateBefore: string
  missingRateAfter: string
  duplicatesBefore: number
  duplicatesAfter: number
  qualityBefore: number
  qualityAfter: number
  improvementPct: number
  columnComparisons: ColumnComparison[]
  originalFile: string
  cleanedFile: string
}

interface ComparisonTabProps {
  datasetId: string
}

function parseCSVClient(content: string) {
  const lines = content.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
  return { headers, rows }
}

function analyzeCSV(headers: string[], rows: Record<string, string>[]) {
  const rowCount = rows.length
  const colCount = headers.length

  const columnStats = headers.map((h) => {
    const vals = rows.map((r) => r[h] ?? '')
    const missing = vals.filter((v) => v === '').length
    const nonEmpty = vals.filter((v) => v !== '')
    const isNumeric = nonEmpty.filter((v) => !isNaN(Number(v))).length > nonEmpty.length * 0.8
    return {
      name: h,
      type: isNumeric ? 'numeric' : 'categorical',
      missing,
      missingPct: rowCount > 0 ? ((missing / rowCount) * 100).toFixed(2) : '0',
    }
  })

  const totalMissing = columnStats.reduce((s, c) => s + c.missing, 0)
  const missingRate = rowCount > 0 ? ((totalMissing / (rowCount * colCount)) * 100).toFixed(2) : '0'

  const seen = new Set()
  let duplicates = 0
  rows.forEach((row) => {
    const key = JSON.stringify(row)
    if (seen.has(key)) duplicates++
    else seen.add(key)
  })

  const riskScore = Math.min(100, Math.round(
    parseFloat(missingRate) * 0.5 + (duplicates / Math.max(rowCount, 1)) * 30
  ))
  const qualityScore = Math.max(0, 100 - riskScore)

  return { rowCount, colCount, totalMissing, missingRate, duplicates, qualityScore, columnStats }
}

export function ComparisonTab({ datasetId }: ComparisonTabProps) {
  const [originalData, setOriginalData] = useState<ReturnType<typeof analyzeCSV> | null>(null)
  const [cleanedData, setCleanedData] = useState<ReturnType<typeof analyzeCSV> | null>(null)
  const [cleanedFileName, setCleanedFileName] = useState<string>('')
  const [originalFileName, setOriginalFileName] = useState<string>('')
  const [loadingOriginal, setLoadingOriginal] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)

  // Load original dataset on mount
  useEffect(() => {
    loadOriginal()
  }, [datasetId])

  const loadOriginal = async () => {
    setLoadingOriginal(true)
    try {
      const res = await fetch(`/api/analysis/${datasetId}`)
      const meta = await res.json()
      const fileName = meta.fileName || `${datasetId}.csv`
      setOriginalFileName(fileName)

      // Fetch the actual file
      const fileRes = await fetch(`/uploads/${datasetId}_${fileName}`)
      if (!fileRes.ok) {
        // Try without filename
        const files = await fetch(`/api/analysis/${datasetId}/profile`)
        const profileData = await files.json()
        // Use profile data to simulate original stats
        if (profileData.rowCount !== undefined) {
          setOriginalData({
            rowCount: profileData.rowCount,
            colCount: profileData.columnCount,
            totalMissing: profileData.missingTotal,
            missingRate: profileData.missingPct?.toString() ?? '0',
            duplicates: profileData.duplicateRows ?? 0,
            qualityScore: Math.max(0, 100 - Math.round(
              (profileData.missingPct ?? 0) * 0.5 +
              ((profileData.duplicateRows ?? 0) / Math.max(profileData.rowCount, 1)) * 30
            )),
            columnStats: (profileData.columns ?? []).map((c: any) => ({
              name: c.name,
              type: c.type ?? 'unknown',
              missing: c.missing ?? 0,
              missingPct: c.missingPct?.toString() ?? '0',
            }))
          })
        }
        return
      }

      const content = await fileRes.text()
      const { headers, rows } = parseCSVClient(content)
      setOriginalData(analyzeCSV(headers, rows))
    } catch (err) {
      console.error('Could not load original:', err)
    } finally {
      setLoadingOriginal(false)
    }
  }

  const handleCleanedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCleanedFileName(file.name)
    const content = await file.text()
    const { headers, rows } = parseCSVClient(content)
    const cleaned = analyzeCSV(headers, rows)
    setCleanedData(cleaned)

    if (originalData) {
      buildComparison(originalData, cleaned, file.name)
    }
  }

  const buildComparison = (
    orig: ReturnType<typeof analyzeCSV>,
    cleaned: ReturnType<typeof analyzeCSV>,
    cleanedFile: string
  ) => {
    const improvementPct = orig.totalMissing > 0
      ? Math.round((1 - cleaned.totalMissing / orig.totalMissing) * 100)
      : 100

    const columnComparisons: ColumnComparison[] = orig.columnStats.map((origCol) => {
      const cleanedCol = cleaned.columnStats.find((c) => c.name === origCol.name)
      return {
        name: origCol.name,
        type: origCol.type,
        missingBefore: origCol.missing,
        missingAfter: cleanedCol?.missing ?? 0,
        missingPctBefore: origCol.missingPct,
        missingPctAfter: cleanedCol?.missingPct ?? '0',
        improvement: origCol.missing - (cleanedCol?.missing ?? 0),
      }
    })

    const res: ComparisonResult = {
      rowsBefore: orig.rowCount,
      rowsAfter: cleaned.rowCount,
      colsBefore: orig.colCount,
      colsAfter: cleaned.colCount,
      missingBefore: orig.totalMissing,
      missingAfter: cleaned.totalMissing,
      missingRateBefore: orig.missingRate,
      missingRateAfter: cleaned.missingRate,
      duplicatesBefore: orig.duplicates,
      duplicatesAfter: cleaned.duplicates,
      qualityBefore: orig.qualityScore,
      qualityAfter: cleaned.qualityScore,
      improvementPct,
      columnComparisons,
      originalFile: originalFileName,
      cleanedFile,
    }
    setResult(res)
    toast.success('Comparison complete!')
  }

  const qualityDiff = result ? result.qualityAfter - result.qualityBefore : 0
  const isImproved = qualityDiff > 0

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Before & After Comparison</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Upload your cleaned CSV to compare it against the original dataset.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Badge variant="secondary">Before</Badge>
              Original Dataset
            </h4>
            <Card className="p-4 border-2 border-dashed">
              {loadingOriginal ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : originalData ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rows</span>
                    <span className="font-medium">{originalData.rowCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Columns</span>
                    <span className="font-medium">{originalData.colCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Missing Values</span>
                    <span className="font-medium text-red-500">{originalData.totalMissing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duplicates</span>
                    <span className="font-medium text-yellow-500">{originalData.duplicates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quality Score</span>
                    <span className="font-medium">{originalData.qualityScore}/100</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Loading original data...</p>
              )}
            </Card>
          </div>

          {/* Cleaned */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Badge className="bg-green-500">After</Badge>
              Cleaned Dataset
            </h4>
            <Card className="p-4 border-2 border-dashed border-green-300 dark:border-green-800">
              {cleanedData ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rows</span>
                    <span className="font-medium">{cleanedData.rowCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Columns</span>
                    <span className="font-medium">{cleanedData.colCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Missing Values</span>
                    <span className="font-medium text-green-500">{cleanedData.totalMissing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duplicates</span>
                    <span className="font-medium text-green-500">{cleanedData.duplicates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quality Score</span>
                    <span className="font-medium text-green-500">{cleanedData.qualityScore}/100</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 truncate">{cleanedFileName}</p>
                </div>
              ) : (
                <label htmlFor="cleaned-upload" className="cursor-pointer block">
                  <div className="flex flex-col items-center justify-center h-24 hover:bg-muted/30 rounded transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Upload cleaned CSV</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to browse</p>
                  </div>
                  <input
                    id="cleaned-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCleanedUpload}
                    className="hidden"
                  />
                </label>
              )}
            </Card>
            {cleanedData && (
              <label htmlFor="cleaned-upload-2" className="cursor-pointer mt-2 block">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <span><Upload className="h-3 w-3 mr-2" />Upload Different File</span>
                </Button>
                <input
                  id="cleaned-upload-2"
                  type="file"
                  accept=".csv"
                  onChange={handleCleanedUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </Card>

      {/* Comparison Results */}
      {result && (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className={`text-2xl font-bold ${isImproved ? 'text-green-500' : 'text-red-500'}`}>
                {isImproved ? '+' : ''}{qualityDiff}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Quality Score Change</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {result.missingBefore - result.missingAfter}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Missing Values Fixed</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {result.duplicatesBefore - result.duplicatesAfter}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Duplicates Removed</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {result.improvementPct}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Overall Improvement</div>
            </Card>
          </div>

          {/* Side by Side */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Side-by-Side Comparison</h4>
            <div className="space-y-4">
              {[
                { label: 'Total Rows', before: result.rowsBefore, after: result.rowsAfter },
                { label: 'Missing Values', before: result.missingBefore, after: result.missingAfter },
                { label: 'Duplicate Rows', before: result.duplicatesBefore, after: result.duplicatesAfter },
                { label: 'Quality Score', before: result.qualityBefore, after: result.qualityAfter, suffix: '/100' },
              ].map((metric) => (
                <div key={metric.label} className="grid grid-cols-3 items-center gap-4">
                  <div className="text-sm font-medium">{metric.label}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-16 text-right">{metric.before}{metric.suffix}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className={`text-sm font-semibold w-16 ${metric.after <= metric.before || metric.label === 'Quality Score' && metric.after >= metric.before ? 'text-green-500' : 'text-red-500'}`}>
                      {metric.after}{metric.suffix}
                    </span>
                  </div>
                  <div>
                    {metric.label === 'Quality Score' ? (
                      <Progress value={metric.after} className="h-2" />
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        {metric.before > metric.after
                          ? <span className="text-green-500">▼ {metric.before - metric.after} reduced</span>
                          : metric.before < metric.after
                          ? <span className="text-red-500">▲ {metric.after - metric.before} increased</span>
                          : <span className="text-muted-foreground">— no change</span>
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Column Level Comparison */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Column-Level Missing Values</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Column</th>
                    <th className="text-right py-2 px-3">Before</th>
                    <th className="text-right py-2 px-3">After</th>
                    <th className="text-right py-2 px-3">Fixed</th>
                    <th className="text-right py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.columnComparisons.map((col) => (
                    <tr key={col.name} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium">{col.name}</td>
                      <td className={`py-2 px-3 text-right ${col.missingBefore > 0 ? 'text-red-500' : ''}`}>
                        {col.missingBefore} ({col.missingPctBefore}%)
                      </td>
                      <td className={`py-2 px-3 text-right ${col.missingAfter > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {col.missingAfter} ({col.missingPctAfter}%)
                      </td>
                      <td className="py-2 px-3 text-right text-green-500 font-medium">
                        {col.improvement > 0 ? `+${col.improvement}` : col.improvement}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {col.missingAfter === 0 && col.missingBefore > 0 ? (
                          <span className="text-green-500 flex items-center justify-end gap-1">
                            <CheckCircle className="h-3 w-3" /> Fixed
                          </span>
                        ) : col.missingAfter === 0 ? (
                          <span className="text-muted-foreground">Clean</span>
                        ) : col.improvement > 0 ? (
                          <span className="text-yellow-500 flex items-center justify-end gap-1">
                            <TrendingDown className="h-3 w-3" /> Improved
                          </span>
                        ) : (
                          <span className="text-red-500">Still missing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {!cleanedData && !loadingOriginal && (
        <Card className="p-6 border-dashed text-center">
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">Upload your cleaned dataset to compare</p>
          <p className="text-xs text-muted-foreground mb-4">
            Run the cleaning script from the Insights tab, then upload the cleaned CSV here
          </p>
          <label htmlFor="cleaned-upload-cta" className="cursor-pointer">
            <Button asChild>
              <span><Upload className="h-4 w-4 mr-2" />Upload Cleaned CSV</span>
            </Button>
            <input
              id="cleaned-upload-cta"
              type="file"
              accept=".csv"
              onChange={handleCleanedUpload}
              className="hidden"
            />
          </label>
        </Card>
      )}
    </div>
  )
}