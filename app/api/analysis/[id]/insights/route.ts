import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

function calculateQualityScore(
  rowCount: number,
  columnCount: number,
  missingTotal: number,
  duplicateRows: number
): number {
  if (rowCount === 0) return 0
  const missingRatio = (missingTotal / (rowCount * columnCount)) * 100
  const duplicateRatio = (duplicateRows / rowCount) * 100
  let score = 100
  score -= Math.min(missingRatio * 0.3, 30)
  score -= Math.min(duplicateRatio * 2, 20)
  return Math.max(0, Math.round(score))
}

function generateInsights(
  rowCount: number,
  columnCount: number,
  missingTotal: number,
  duplicateRows: number,
  columns: any[],
  fileName: string
): any {
  const insights: any[] = []

  if (missingTotal > 0) {
    const missingRatio = ((missingTotal / (rowCount * columnCount)) * 100).toFixed(2)
    insights.push({
      category: 'data-quality',
      title: 'Missing Values Detected',
      description: `Found ${missingTotal} missing values (${missingRatio}%) across your dataset.`,
      severity: missingTotal > rowCount * 0.1 ? 'critical' : 'warning',
      recommendation:
        missingTotal > rowCount * 0.1
          ? 'Remove rows with excessive missing values or use imputation techniques.'
          : 'Consider removing rows or using appropriate imputation methods.',
    })
  }

  if (duplicateRows > 0) {
    insights.push({
      category: 'duplicates',
      title: 'Duplicate Rows Found',
      description: `Identified ${duplicateRows} duplicate row(s) in your dataset.`,
      severity: 'warning',
      recommendation: 'Remove duplicate rows using drop_duplicates() in Python.',
    })
  }

  if (columns.some((col) => col.type === 'unknown')) {
    insights.push({
      category: 'data-type',
      title: 'Ambiguous Column Types',
      description: 'Some columns have unknown or mixed data types.',
      severity: 'info',
      recommendation: 'Review and standardize column data types for accurate analysis.',
    })
  }

  const highMissingCols = columns.filter((col) => col.missingPct > 10)
  if (highMissingCols.length > 0) {
    insights.push({
      category: 'distribution',
      title: 'Columns with High Missing Percentage',
      description: `${highMissingCols.length} column(s) have more than 10% missing values: ${highMissingCols.map((c) => c.name).join(', ')}`,
      severity: 'warning',
      recommendation: 'Decide whether to drop these columns or apply appropriate imputation strategies.',
    })
  }

  // Check for skewed numeric columns
  const numericCols = columns.filter((col) => col.type === 'numeric' || col.type === 'integer' || col.type === 'float')
  if (numericCols.length > 0) {
    insights.push({
      category: 'statistics',
      title: `${numericCols.length} Numeric Column(s) Detected`,
      description: `Numeric columns: ${numericCols.map((c) => c.name).join(', ')}. These can be used for regression, clustering, or statistical analysis.`,
      severity: 'info',
      recommendation: 'Check for outliers and skewness in numeric columns before modeling.',
    })
  }

  const cleaningScript = generateCleaningScript(columns, duplicateRows > 0, missingTotal > 0, fileName)

  return { insights, cleaningScript }
}

function generateCleaningScript(
  columns: any[],
  hasDuplicates: boolean,
  hasMissing: boolean,
  fileName: string
): string {
  const cleanedFileName = `cleaned_${fileName}`
  const steps: string[] = []

  steps.push('import pandas as pd\nimport numpy as np')
  steps.push(`\n# ============================================`)
  steps.push(`# EDA Assistant — Auto-Generated Cleaning Script`)
  steps.push(`# Dataset: ${fileName}`)
  steps.push(`# ============================================\n`)
  steps.push(`df = pd.read_csv("${fileName}")`)
  steps.push(`print(f"Original shape: {df.shape}")`)

  if (hasDuplicates) {
    steps.push(`\n# --- Remove duplicate rows ---`)
    steps.push(`duplicates_before = df.duplicated().sum()`)
    steps.push(`df = df.drop_duplicates()`)
    steps.push(`print(f"Removed {duplicates_before} duplicate rows")`)
  }

  if (hasMissing) {
    const missingCols = columns.filter((col) => col.missing > 0)
    if (missingCols.length > 0) {
      steps.push(`\n# --- Handle missing values ---`)
      missingCols.forEach((col) => {
        const isNumeric = col.type === 'numeric' || col.type === 'integer' || col.type === 'float'
        if (isNumeric) {
          steps.push(`df['${col.name}'] = df['${col.name}'].fillna(df['${col.name}'].median())  # ${col.missing} missing values filled with median`)
        } else {
          steps.push(`df['${col.name}'] = df['${col.name}'].fillna(df['${col.name}'].mode()[0] if not df['${col.name}'].mode().empty else 'Unknown')  # ${col.missing} missing values filled with mode`)
        }
      })
    }
  }

  // Outlier capping for numeric columns
  const numericCols = columns.filter(
    (col) => col.type === 'numeric' || col.type === 'integer' || col.type === 'float'
  )
  if (numericCols.length > 0) {
    steps.push(`\n# --- Cap outliers using IQR method ---`)
    numericCols.forEach((col) => {
      steps.push(`Q1_${col.name.replace(/\W/g, '_')} = df['${col.name}'].quantile(0.25)`)
      steps.push(`Q3_${col.name.replace(/\W/g, '_')} = df['${col.name}'].quantile(0.75)`)
      steps.push(`IQR_${col.name.replace(/\W/g, '_')} = Q3_${col.name.replace(/\W/g, '_')} - Q1_${col.name.replace(/\W/g, '_')}`)
      steps.push(`df['${col.name}'] = df['${col.name}'].clip(`)
      steps.push(`    lower=Q1_${col.name.replace(/\W/g, '_')} - 1.5 * IQR_${col.name.replace(/\W/g, '_')},`)
      steps.push(`    upper=Q3_${col.name.replace(/\W/g, '_')} + 1.5 * IQR_${col.name.replace(/\W/g, '_')}`)
      steps.push(`)`)
    })
  }

  steps.push(`\n# --- Verify results ---`)
  steps.push(`print(f"Cleaned shape: {df.shape}")`)
  steps.push(`print(f"Missing values remaining: {df.isnull().sum().sum()}")`)
  steps.push(`print(f"Duplicate rows remaining: {df.duplicated().sum()}")`)
  steps.push(`print("\\nData types:")`)
  steps.push(`print(df.dtypes)`)
  steps.push(`print("\\nBasic statistics:")`)
  steps.push(`print(df.describe())`)

  steps.push(`\n# --- Save cleaned dataset ---`)
  steps.push(`df.to_csv("${cleanedFileName}", index=False)`)
  steps.push(`print(f"\\n✅ Cleaned dataset saved as: ${cleanedFileName}")`)

  return steps.join('\n')
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
      return NextResponse.json({
        summary: 'Unable to analyze dataset. File not found.',
        insights: [],
        qualityScore: 0,
        cleaningScript: '',
      })
    }

    // Get real filename (strip dataset_id prefix)
    const actualFileName = datasetFile.replace(`${datasetId}_`, '')

    const filePath = join(uploadsDir, datasetFile)
    const content = await readFile(filePath, 'utf-8')
    const lines = content.split('\n').filter((l) => l.trim())

    if (lines.length < 1) {
      return NextResponse.json({
        summary: 'Dataset is empty.',
        insights: [],
        qualityScore: 0,
        cleaningScript: '',
      })
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    const dataRows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
      const row: Record<string, string> = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })
      return row
    })

    // Analyze columns with type detection
    const columns = headers.map((header) => {
      const columnValues = dataRows.map((row) => row[header] || '')
      const missing = columnValues.filter((v) => v === '').length
      const nonEmpty = columnValues.filter((v) => v !== '')
      const unique = new Set(nonEmpty).size

      // Detect type
      const numericCount = nonEmpty.filter((v) => !isNaN(Number(v))).length
      const isNumeric = numericCount > nonEmpty.length * 0.8
      const isInteger = isNumeric && nonEmpty.every((v) => Number.isInteger(Number(v)))

      return {
        name: header,
        missing,
        missingPct: columnValues.length > 0 ? (missing / columnValues.length) * 100 : 0,
        unique,
        type: isInteger ? 'integer' : isNumeric ? 'numeric' : 'string',
      }
    })

    const rowCount = dataRows.length
    const columnCount = headers.length
    const missingTotal = columns.reduce((sum, col) => sum + col.missing, 0)

    const seen = new Set()
    let duplicateRows = 0
    dataRows.forEach((row) => {
      const hash = JSON.stringify(row)
      if (seen.has(hash)) duplicateRows++
      else seen.add(hash)
    })

    const qualityScore = calculateQualityScore(rowCount, columnCount, missingTotal, duplicateRows)

    const { insights, cleaningScript } = generateInsights(
      rowCount,
      columnCount,
      missingTotal,
      duplicateRows,
      columns,
      actualFileName  // ← real filename passed here
    )

    const summary = `Your dataset "${actualFileName}" contains ${rowCount} rows and ${columnCount} columns with a quality score of ${qualityScore}%. ${duplicateRows > 0 ? `Found ${duplicateRows} duplicate rows. ` : ''}${missingTotal > 0 ? `Found ${missingTotal} missing values across ${columns.filter(c => c.missing > 0).length} columns.` : 'No missing values detected.'}`

    return NextResponse.json({
      summary,
      insights,
      qualityScore,
      cleaningScript,
    })
  } catch (error) {
    console.error('Error loading insights:', error)
    return NextResponse.json(
      { error: 'Failed to load insights' },
      { status: 500 }
    )
  }
}