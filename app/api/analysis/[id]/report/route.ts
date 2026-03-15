import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'

function parseCSV(content: string) {
  const lines = content.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })
  return { headers, rows }
}

function analyzeDataset(headers: string[], rows: Record<string, string>[]) {
  const rowCount = rows.length
  const colCount = headers.length

  // Missing values per column
  const columnStats = headers.map((header) => {
    const values = rows.map((r) => r[header] || '')
    const missing = values.filter((v) => v === '').length
    const nonEmpty = values.filter((v) => v !== '')
    const unique = new Set(nonEmpty).size
    const numeric = nonEmpty.filter((v) => !isNaN(Number(v)))
    const isNumeric = numeric.length > nonEmpty.length * 0.8

    let mean = null, min = null, max = null, std = null
    if (isNumeric && numeric.length > 0) {
      const nums = numeric.map(Number)
      mean = nums.reduce((a, b) => a + b, 0) / nums.length
      min = Math.min(...nums)
      max = Math.max(...nums)
      const variance = nums.reduce((a, b) => a + Math.pow(b - mean!, 2), 0) / nums.length
      std = Math.sqrt(variance)
    }

    return {
      name: header,
      type: isNumeric ? 'numeric' : 'categorical',
      missing,
      missingPct: rowCount > 0 ? ((missing / rowCount) * 100).toFixed(2) : '0',
      unique,
      mean: mean !== null ? mean.toFixed(2) : null,
      min: min !== null ? min.toFixed(2) : null,
      max: max !== null ? max.toFixed(2) : null,
      std: std !== null ? std.toFixed(2) : null,
    }
  })

  // Duplicate rows
  const seen = new Set()
  let duplicates = 0
  rows.forEach((row) => {
    const key = JSON.stringify(row)
    if (seen.has(key)) duplicates++
    else seen.add(key)
  })

  const totalMissing = columnStats.reduce((sum, c) => sum + c.missing, 0)
  const missingRate = rowCount > 0 ? (totalMissing / (rowCount * colCount)) * 100 : 0
  const duplicateRate = rowCount > 0 ? (duplicates / rowCount) * 100 : 0

  // Risk score
  const riskScore = Math.min(100, Math.round(missingRate * 0.5 + duplicateRate * 0.3 + (columnStats.filter(c => c.missing > rowCount * 0.3).length / colCount) * 20))
  const riskLevel = riskScore < 30 ? 'Low' : riskScore < 60 ? 'Medium' : 'High'

  // Quality score
  const qualityScore = Math.max(0, 100 - riskScore)

  return {
    rowCount,
    colCount,
    totalMissing,
    missingRate: missingRate.toFixed(2),
    duplicates,
    duplicateRate: duplicateRate.toFixed(2),
    columnStats,
    riskScore,
    riskLevel,
    qualityScore,
  }
}

async function generateAIReport(
  fileName: string,
  analysis: ReturnType<typeof analyzeDataset>
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return generateFallbackReport(fileName, analysis)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const columnSummary = analysis.columnStats
      .map(c => `- ${c.name} (${c.type}): ${c.missingPct}% missing, ${c.unique} unique values${c.mean ? `, mean=${c.mean}, min=${c.min}, max=${c.max}` : ''}`)
      .join('\n')

    const highMissingCols = analysis.columnStats.filter(c => parseFloat(c.missingPct) > 10)

    const prompt = `You are a senior data scientist. Generate a comprehensive, professional EDA report for this dataset.

DATASET: ${fileName}
ROWS: ${analysis.rowCount}
COLUMNS: ${analysis.colCount}
TOTAL MISSING VALUES: ${analysis.totalMissing} (${analysis.missingRate}%)
DUPLICATE ROWS: ${analysis.duplicates} (${analysis.duplicateRate}%)
RISK SCORE: ${analysis.riskScore}/100 (${analysis.riskLevel})
QUALITY SCORE: ${analysis.qualityScore}/100

COLUMN DETAILS:
${columnSummary}

${highMissingCols.length > 0 ? `HIGH MISSING COLUMNS (>10%): ${highMissingCols.map(c => c.name).join(', ')}` : ''}

Write a detailed professional report with EXACTLY these sections:

## 1. Executive Summary
3-4 sentences summarizing what this dataset is, its quality, and key findings.

## 2. Dataset Overview
Describe the structure: rows, columns, types, completeness percentage.

## 3. Data Quality Analysis
Detail every quality issue. Mention specific column names and exact numbers.

## 4. Column-by-Column Analysis
For each column describe: what it likely represents, data type, quality, any anomalies.

## 5. Risk Assessment
Explain the risk score of ${analysis.riskScore}/100 and what factors contribute to it.

## 6. Error Analysis
What errors exist, why they are problematic, how they affect analysis or modeling.

## 7. Recommended Actions
Specific, actionable steps with actual column names. List at least 5 concrete steps.

## 8. Best ML Models for This Dataset
Based on the column types and data structure:
- Numeric columns: ${analysis.columnStats.filter(c => c.type === 'numeric').map(c => c.name).join(', ') || 'none'}
- Categorical columns: ${analysis.columnStats.filter(c => c.type === 'categorical').map(c => c.name).join(', ') || 'none'}

Recommend the top 3 most suitable ML models with specific reasons based on this data structure.
Also state: what task this dataset is best suited for (classification, regression, clustering, time series).

## 9. Conclusion
Final assessment of data readiness and overall recommendation.

Be specific. Use the exact numbers provided. Do not invent statistics.`

    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error: any) {
    console.error('Gemini error full:', error?.message || error)
    return generateFallbackReport(fileName, analysis)
  }
}

function generateFallbackReport(
  fileName: string,
  analysis: ReturnType<typeof analyzeDataset>
): string {
  const highMissing = analysis.columnStats.filter(c => parseFloat(c.missingPct) > 10)
  const numericCols = analysis.columnStats.filter(c => c.type === 'numeric')
  const categoricalCols = analysis.columnStats.filter(c => c.type === 'categorical')

  return `## 1. Executive Summary
This dataset (${fileName}) contains ${analysis.rowCount} rows and ${analysis.colCount} columns with an overall quality score of ${analysis.qualityScore}/100. ${analysis.totalMissing > 0 ? `There are ${analysis.totalMissing} missing values requiring attention.` : 'No missing values detected.'} ${analysis.duplicates > 0 ? `${analysis.duplicates} duplicate rows were found.` : 'No duplicate rows detected.'}

## 2. Dataset Overview
- File: ${fileName}
- Total Rows: ${analysis.rowCount}
- Total Columns: ${analysis.colCount}
- Numeric Columns: ${numericCols.length}
- Categorical Columns: ${categoricalCols.length}
- Data Completeness: ${(100 - parseFloat(analysis.missingRate)).toFixed(1)}%
- Duplicate Rate: ${analysis.duplicateRate}%

## 3. Data Quality Analysis
Overall Risk Level: ${analysis.riskLevel} (Score: ${analysis.riskScore}/100)

Missing Values: ${analysis.totalMissing} total missing cells (${analysis.missingRate}% of all data)
${highMissing.length > 0 ? `Columns with >10% missing: ${highMissing.map(c => `${c.name} (${c.missingPct}%)`).join(', ')}` : 'No columns with excessive missing values.'}

Duplicates: ${analysis.duplicates} duplicate rows (${analysis.duplicateRate}%)

## 4. Column-by-Column Analysis
${analysis.columnStats.map(c => `
### ${c.name}
- Type: ${c.type}
- Missing: ${c.missing} values (${c.missingPct}%)
- Unique Values: ${c.unique}
${c.mean !== null ? `- Mean: ${c.mean}\n- Min: ${c.min}\n- Max: ${c.max}\n- Std Dev: ${c.std}` : ''}
`).join('\n')}

## 5. Risk Assessment
Risk Score: ${analysis.riskScore}/100 (${analysis.riskLevel} Risk)

Contributing factors:
- Missing data rate: ${analysis.missingRate}%
- Duplicate row rate: ${analysis.duplicateRate}%
- High-missing columns: ${highMissing.length}

## 6. Error Analysis
${analysis.totalMissing > 0 ? `Missing values in ${analysis.columnStats.filter(c => c.missing > 0).length} columns can bias statistical results and reduce model accuracy.` : 'No missing value errors detected.'}
${analysis.duplicates > 0 ? `${analysis.duplicates} duplicate rows can skew distributions and inflate dataset size artificially.` : 'No duplicate row errors detected.'}

## 7. Recommended Actions
${analysis.duplicates > 0 ? `1. Remove ${analysis.duplicates} duplicate rows: df.drop_duplicates(inplace=True)` : '1. Dataset has no duplicates - no action needed.'}
${analysis.columnStats.filter(c => c.missing > 0 && c.type === 'numeric').map((c, i) => `${i + 2}. Fill missing values in '${c.name}' with median: df['${c.name}'].fillna(df['${c.name}'].median(), inplace=True)`).join('\n')}
${analysis.columnStats.filter(c => c.missing > 0 && c.type === 'categorical').map((c, i) => `- Fill missing values in '${c.name}' with mode: df['${c.name}'].fillna(df['${c.name}'].mode()[0], inplace=True)`).join('\n')}

## 8. Best ML Models for This Dataset
Based on the column types and data structure:
- Numeric columns: ${numericCols.map(c => c.name).join(', ') || 'none'}
- Categorical columns: ${categoricalCols.map(c => c.name).join(', ') || 'none'}

This dataset appears best suited for ${numericCols.length > categoricalCols.length ? 'regression or clustering tasks' : categoricalCols.length > 0 ? 'classification tasks' : 'unsupervised learning or clustering'}.

Recommended top 3 ML models:
1. ${numericCols.length > 0 && categoricalCols.length > 0 ? 'Random Forest' : numericCols.length > 0 ? 'Linear Regression' : 'Logistic Regression'} - Handles mixed data types well and provides feature importance.
2. ${numericCols.length > categoricalCols.length ? 'Gradient Boosting (XGBoost)' : 'Support Vector Machine (SVM)'} - Effective for ${numericCols.length > categoricalCols.length ? 'regression' : 'classification'} with good performance on structured data.
3. ${analysis.rowCount > 1000 ? 'Neural Network (if scaled appropriately)' : 'K-Nearest Neighbors'} - ${analysis.rowCount > 1000 ? 'Can capture complex patterns in larger datasets' : 'Simple and interpretable for smaller datasets'}.

## 9. Conclusion
This dataset has a quality score of ${analysis.qualityScore}/100. ${analysis.qualityScore >= 80 ? 'The dataset is in good condition and ready for analysis with minor preprocessing.' : analysis.qualityScore >= 60 ? 'The dataset requires moderate cleaning before use in analysis or modeling.' : 'The dataset requires significant cleaning before it can be reliably used for analysis or modeling.'}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: datasetId } = await params
    const uploadsDir = join(process.cwd(), 'public', 'uploads')

    const files = await readdir(uploadsDir)
    const datasetFile = files.find((f) => f.startsWith(datasetId))

    if (!datasetFile) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    const filePath = join(uploadsDir, datasetFile)
    const content = await readFile(filePath, 'utf-8')
    const { headers, rows } = parseCSV(content)
    const fileName = datasetFile.replace(`${datasetId}_`, '')
    const analysis = analyzeDataset(headers, rows)
    const reportText = await generateAIReport(fileName, analysis)

    return NextResponse.json({
      title: 'EDA Assistant — Full Analysis Report',
      dataset: fileName,
      datasetId,
      generatedAt: new Date().toISOString(),
      qualityScore: analysis.qualityScore,
      riskScore: analysis.riskScore,
      riskLevel: analysis.riskLevel,
      rowCount: analysis.rowCount,
      columnCount: analysis.colCount,
      totalMissing: analysis.totalMissing,
      missingRate: analysis.missingRate,
      duplicateRows: analysis.duplicates,
      columnStats: analysis.columnStats,
      reportText,
    })
  } catch (error) {
    console.error('Report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Redirect POST to GET for backwards compatibility
  return GET(request, { params })
}