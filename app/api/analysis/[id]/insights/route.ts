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
  score -= Math.min(missingRatio * 0.3, 30) // Missing values: max -30
  score -= Math.min(duplicateRatio * 2, 20) // Duplicates: max -20

  return Math.max(0, Math.round(score))
}

function generateInsights(
  rowCount: number,
  columnCount: number,
  missingTotal: number,
  duplicateRows: number,
  columns: any[]
): any {
  const insights: any[] = []

  // Missing values insight
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

  // Duplicates insight
  if (duplicateRows > 0) {
    insights.push({
      category: 'duplicates',
      title: 'Duplicate Rows Found',
      description: `Identified ${duplicateRows} duplicate row(s) in your dataset.`,
      severity: 'warning',
      recommendation: 'Remove duplicate rows using drop_duplicates() in Python or your data tool.',
    })
  }

  // Column type consistency
  const typeDistribution: Record<string, number> = {}
  columns.forEach((col) => {
    typeDistribution[col.type] = (typeDistribution[col.type] || 0) + 1
  })

  if (columns.some((col) => col.type === 'unknown')) {
    insights.push({
      category: 'data-type',
      title: 'Ambiguous Column Types',
      description: 'Some columns have unknown or mixed data types.',
      severity: 'info',
      recommendation: 'Review and standardize column data types for accurate analysis.',
    })
  }

  // Data distribution
  const highMissingCols = columns.filter((col) => col.missingPct > 10)
  if (highMissingCols.length > 0) {
    insights.push({
      category: 'distribution',
      title: 'Columns with High Missing Percentage',
      description: `${highMissingCols.length} column(s) have more than 10% missing values: ${highMissingCols.map((c) => c.name).join(', ')}`,
      severity: 'warning',
      recommendation:
        'Decide whether to drop these columns or apply appropriate imputation strategies.',
    })
  }

  // Generate cleaning script
  const cleaningScript = generateCleaningScript(columns, duplicateRows, missingTotal > 0)

  return {
    insights,
    cleaningScript,
  }
}

function generateCleaningScript(columns: any[], hasDuplicates: boolean, hasMissing: boolean): string {
  const steps = []

  steps.push('import pandas as pd\nimport numpy as np\n')
  steps.push('# Load your dataset\ndf = pd.read_csv("your_data.csv")')

  if (hasDuplicates) {
    steps.push('\n# Remove duplicate rows\ndf = df.drop_duplicates()')
  }

  if (hasMissing) {
    steps.push('\n# Handle missing values')
    const missingCols = columns.filter((col) => col.missing > 0)
    if (missingCols.length > 0) {
      steps.push(
        `# Option 1: Drop rows with missing values\n# df = df.dropna()\n\n# Option 2: Fill with appropriate values\n${missingCols.map((col) => `# df['${col.name}'].fillna(value, inplace=True)`).join('\n')}`
      )
    }
  }

  steps.push('\n# Verify data types\nprint(df.dtypes)\nprint(df.info())')
  steps.push('\n# Summary statistics\nprint(df.describe())')
  steps.push('\n# Save cleaned data\ndf.to_csv("cleaned_data.csv", index=False)\nprint("Data cleaning complete!")')

  return steps.join('\n')
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasetId = params.id
    const uploadsDir = join(process.cwd(), 'public', 'uploads')

    // Find and read the dataset file
    const files = await readdir(uploadsDir)
    const datasetFile = files.find((f) => f.startsWith(datasetId))

    if (!datasetFile) {
      // Return default insights if file not found
      return NextResponse.json({
        summary: 'Unable to analyze dataset. File not found.',
        insights: [],
        qualityScore: 0,
        cleaningScript: '',
      })
    }

    // Read and parse file
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

    const headers = lines[0].split(',').map((h) => h.trim())
    const dataRows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })
      return row
    })

    // Analyze columns
    const columns = headers.map((header) => {
      const columnValues = dataRows.map((row) => row[header] || '')
      const missing = columnValues.filter((v) => v === '').length
      const unique = new Set(columnValues.filter((v) => v !== '')).size

      return {
        name: header,
        missing,
        missingPct: (missing / columnValues.length) * 100,
        unique,
        type: 'string',
      }
    })

    // Calculate metrics
    const rowCount = dataRows.length
    const columnCount = headers.length
    let missingTotal = 0
    columns.forEach((col) => {
      missingTotal += col.missing
    })

    const seen = new Set()
    let duplicateRows = 0
    dataRows.forEach((row) => {
      const hash = JSON.stringify(row)
      if (seen.has(hash)) {
        duplicateRows++
      } else {
        seen.add(hash)
      }
    })

    // Calculate quality score
    const qualityScore = calculateQualityScore(rowCount, columnCount, missingTotal, duplicateRows)

    // Generate insights
    const { insights, cleaningScript } = generateInsights(
      rowCount,
      columnCount,
      missingTotal,
      duplicateRows,
      columns
    )

    const summary = `Your dataset contains ${rowCount} rows and ${columnCount} columns. Quality score: ${qualityScore}%. ${duplicateRows > 0 ? `Found ${duplicateRows} duplicate rows. ` : ''}${missingTotal > 0 ? `Found ${missingTotal} missing values.` : 'No significant data quality issues detected.'}`

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
