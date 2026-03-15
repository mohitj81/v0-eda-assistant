'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ColumnStat {
  name: string
  type: string
  missing: number
  missingPct: string
  unique: number
  mean: string | null
  min: string | null
  max: string | null
  std: string | null
}

interface ReportData {
  title: string
  dataset: string
  datasetId: string
  generatedAt: string
  qualityScore: number
  riskScore: number
  riskLevel: string
  rowCount: number
  columnCount: number
  totalMissing: number
  missingRate: string
  duplicateRows: number
  columnStats: ColumnStat[]
  reportText: string
}

interface ReportTabProps {
  datasetId: string
}

export function ReportTab({ datasetId }: ReportTabProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)

  const fetchReport = async (): Promise<ReportData | null> => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/analysis/${datasetId}/report`)
      if (!response.ok) throw new Error('Failed to generate report')
      const data = await response.json()
      setReportData(data)
      toast.success('Report generated successfully!')
      return data
    } catch (error) {
      toast.error('Failed to generate report. Please try again.')
      console.error(error)
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadTxt = async () => {
    const data = reportData || await fetchReport()
    if (!data) return

    const content = buildTextReport(data)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `EDA_Report_${data.dataset}_${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Text report downloaded!')
  }

  const downloadHTML = async () => {
    const data = reportData || await fetchReport()
    if (!data) return

    const html = buildHTMLReport(data)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `EDA_Report_${data.dataset}_${new Date().toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('HTML report downloaded!')
  }

  const exportPDF = async () => {
    const data = reportData || await fetchReport()
    if (!data) return

    const html = buildHTMLReport(data)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow popups to generate PDF')
      return
    }
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
    toast.success('Print dialog opened — save as PDF!')
  }

  const riskColor = reportData?.riskLevel === 'Low'
    ? 'text-green-600'
    : reportData?.riskLevel === 'Medium'
    ? 'text-yellow-600'
    : 'text-red-600'

  const qualityColor = (score: number) =>
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Full EDA Report</h3>
            <p className="text-muted-foreground text-sm mt-1">
              AI-powered analysis with all stats, insights, and recommendations
            </p>
          </div>
          {reportData && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3 mr-1" /> Ready
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Button
            onClick={exportPDF}
            disabled={isGenerating}
            size="lg"
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'Export as PDF'}
          </Button>

          <Button
            onClick={downloadHTML}
            disabled={isGenerating}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download HTML
          </Button>

          <Button
            onClick={downloadTxt}
            disabled={isGenerating}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download TXT
          </Button>
        </div>
      </Card>

      {/* Report Preview — shown after generation */}
      {reportData ? (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold">{reportData.rowCount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Rows</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold">{reportData.columnCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Columns</div>
            </Card>
            <Card className="p-4 text-center">
              <div className={`text-2xl font-bold ${qualityColor(reportData.qualityScore)}`}>
                {reportData.qualityScore}/100
              </div>
              <div className="text-xs text-muted-foreground mt-1">Quality Score</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{reportData.totalMissing}</div>
              <div className="text-xs text-muted-foreground mt-1">Missing Values ({reportData.missingRate}%)</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">{reportData.duplicateRows}</div>
              <div className="text-xs text-muted-foreground mt-1">Duplicate Rows</div>
            </Card>
            <Card className="p-4 text-center">
              <div className={`text-2xl font-bold ${riskColor}`}>{reportData.riskScore}/100</div>
              <div className="text-xs text-muted-foreground mt-1">
                Risk Score &nbsp;
                <span className={`font-semibold ${riskColor}`}>{reportData.riskLevel}</span>
              </div>
            </Card>
          </div>

          {/* Column Stats Table */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Column Statistics</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold">Column</th>
                    <th className="text-left py-2 px-3 font-semibold">Type</th>
                    <th className="text-right py-2 px-3 font-semibold">Missing</th>
                    <th className="text-right py-2 px-3 font-semibold">Missing %</th>
                    <th className="text-right py-2 px-3 font-semibold">Unique</th>
                    <th className="text-right py-2 px-3 font-semibold">Mean</th>
                    <th className="text-right py-2 px-3 font-semibold">Min</th>
                    <th className="text-right py-2 px-3 font-semibold">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.columnStats.map((col) => (
                    <tr key={col.name} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium">{col.name}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">{col.type}</Badge>
                      </td>
                      <td className={`py-2 px-3 text-right ${col.missing > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {col.missing}
                      </td>
                      <td className={`py-2 px-3 text-right ${parseFloat(col.missingPct) > 10 ? 'text-red-500' : ''}`}>
                        {col.missingPct}%
                      </td>
                      <td className="py-2 px-3 text-right">{col.unique}</td>
                      <td className="py-2 px-3 text-right">{col.mean ?? '—'}</td>
                      <td className="py-2 px-3 text-right">{col.min ?? '—'}</td>
                      <td className="py-2 px-3 text-right">{col.max ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI Report Text */}
          <Card className="p-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <h4 className="font-semibold text-blue-700 dark:text-blue-400">AI Analysis & Insights</h4>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {reportData.reportText.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h3 key={i} className="text-base font-bold mt-4 mb-2 text-blue-700 dark:text-blue-400">{line.replace('## ', '')}</h3>
                }
                if (line.startsWith('### ')) {
                  return <h4 key={i} className="text-sm font-semibold mt-3 mb-1">{line.replace('### ', '')}</h4>
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="ml-4 text-sm text-muted-foreground">{line.replace('- ', '')}</li>
                }
                if (line.trim() === '') return <br key={i} />
                return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
              })}
            </div>
          </Card>
        </>
      ) : (
        /* Before generation — what the report will contain */
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Report Includes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Dataset Overview', desc: 'Rows, columns, file info, completeness %' },
              { title: 'Column Statistics', desc: 'Type, missing %, unique values, mean, min, max' },
              { title: 'Risk Assessment', desc: 'Risk score 0-100 with contributing factors' },
              { title: 'AI Insights', desc: 'Gemini-powered analysis of your actual data' },
              { title: 'Error Analysis', desc: 'What issues exist and why they matter' },
              { title: 'Cleaning Actions', desc: 'Python code with your actual column names' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Click any download button above to generate the report. AI analysis may take 10-20 seconds.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTextReport(data: ReportData): string {
  const line = '='.repeat(60)
  const thin = '-'.repeat(60)
  return `${line}
EDA ASSISTANT — FULL ANALYSIS REPORT
${line}
Dataset:       ${data.dataset}
Generated:     ${new Date(data.generatedAt).toLocaleString()}
Report ID:     ${data.datasetId}

${thin}
QUICK STATS
${thin}
Total Rows:        ${data.rowCount}
Total Columns:     ${data.columnCount}
Missing Values:    ${data.totalMissing} (${data.missingRate}%)
Duplicate Rows:    ${data.duplicateRows}
Quality Score:     ${data.qualityScore}/100
Risk Score:        ${data.riskScore}/100 (${data.riskLevel})

${thin}
COLUMN STATISTICS
${thin}
${data.columnStats.map(c =>
  `${c.name} (${c.type})
  Missing: ${c.missing} (${c.missingPct}%) | Unique: ${c.unique}${c.mean ? ` | Mean: ${c.mean} | Min: ${c.min} | Max: ${c.max}` : ''}`
).join('\n\n')}

${thin}
AI ANALYSIS & INSIGHTS
${thin}
${data.reportText}

${line}
Generated by EDA Assistant | ${new Date().toLocaleString()}
${line}`
}

function buildHTMLReport(data: ReportData): string {
  const riskColor = data.riskLevel === 'Low' ? '#22c55e' : data.riskLevel === 'Medium' ? '#f59e0b' : '#ef4444'
  const qualityColor = data.qualityScore >= 80 ? '#22c55e' : data.qualityScore >= 60 ? '#f59e0b' : '#ef4444'

  const formattedReport = data.reportText
    .replace(/## (.*)/g, '<h2 style="color:#1e40af;font-size:18px;font-weight:700;margin:24px 0 8px;border-bottom:2px solid #3b82f6;padding-bottom:6px;">$1</h2>')
    .replace(/### (.*)/g, '<h3 style="font-size:15px;font-weight:600;margin:16px 0 6px;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*)/gm, '<li style="margin-bottom:4px;">$1</li>')
    .replace(/\n\n/g, '</p><p style="margin-bottom:12px;line-height:1.7;">')
    .replace(/\n/g, '<br/>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EDA Report — ${data.dataset}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#111;background:#fff;padding:40px;max-width:960px;margin:0 auto}
    .header{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:28px 32px;border-radius:12px;margin-bottom:28px}
    .header h1{font-size:24px;font-weight:700;margin-bottom:6px}
    .header p{opacity:.85;font-size:13px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px}
    .stat{border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center}
    .stat .val{font-size:26px;font-weight:700}
    .stat .lbl{font-size:11px;color:#6b7280;margin-top:3px}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:28px}
    th{background:#f3f4f6;text-align:left;padding:9px 11px;font-weight:600;border:1px solid #e5e7eb}
    td{padding:7px 11px;border:1px solid #e5e7eb}
    tr:nth-child(even){background:#f9fafb}
    .ai{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:24px;margin-bottom:28px}
    .footer{text-align:center;color:#9ca3af;font-size:11px;margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb}
    @media print{body{padding:20px}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 EDA Assistant — Full Analysis Report</h1>
    <p>Dataset: <strong>${data.dataset}</strong> &nbsp;|&nbsp; Generated: ${new Date(data.generatedAt).toLocaleString()}</p>
  </div>

  <div class="grid">
    <div class="stat"><div class="val">${data.rowCount.toLocaleString()}</div><div class="lbl">Total Rows</div></div>
    <div class="stat"><div class="val">${data.columnCount}</div><div class="lbl">Total Columns</div></div>
    <div class="stat"><div class="val" style="color:${qualityColor}">${data.qualityScore}</div><div class="lbl">Quality Score /100</div></div>
    <div class="stat"><div class="val" style="color:#ef4444">${data.totalMissing}</div><div class="lbl">Missing Values (${data.missingRate}%)</div></div>
    <div class="stat"><div class="val" style="color:#f59e0b">${data.duplicateRows}</div><div class="lbl">Duplicate Rows</div></div>
    <div class="stat"><div class="val" style="color:${riskColor}">${data.riskScore}</div><div class="lbl">Risk Score (${data.riskLevel})</div></div>
  </div>

  <h2 style="font-size:18px;font-weight:700;margin-bottom:12px;">Column Statistics</h2>
  <table>
    <thead>
      <tr><th>Column</th><th>Type</th><th>Missing</th><th>Missing %</th><th>Unique</th><th>Mean</th><th>Min</th><th>Max</th><th>Std</th></tr>
    </thead>
    <tbody>
      ${data.columnStats.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.type}</td>
        <td style="color:${c.missing > 0 ? '#ef4444' : '#22c55e'}">${c.missing}</td>
        <td style="color:${parseFloat(c.missingPct) > 10 ? '#ef4444' : 'inherit'}">${c.missingPct}%</td>
        <td>${c.unique}</td>
        <td>${c.mean ?? '—'}</td>
        <td>${c.min ?? '—'}</td>
        <td>${c.max ?? '—'}</td>
        <td>${c.std ?? '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="ai">
    <h2 style="color:#0369a1;font-size:18px;font-weight:700;margin-bottom:16px;">🤖 AI Analysis & Insights</h2>
    <div>${formattedReport}</div>
  </div>

  <div class="footer">
    Generated by EDA Assistant &nbsp;|&nbsp; ${new Date().toLocaleString()} &nbsp;|&nbsp; Dataset ID: ${data.datasetId}
  </div>
</body>
</html>`
}