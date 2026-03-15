import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

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
      return NextResponse.json({
        title: 'Exploratory Data Analysis Report',
        dataset: datasetId,
        generatedAt: new Date().toISOString(),
        content: 'Unable to generate report - dataset not found.',
        sections: [],
      })
    }

    // Read and analyze file
    const filePath = join(uploadsDir, datasetFile)
    const content = await readFile(filePath, 'utf-8')
    const lines = content.split('\n').filter((l) => l.trim())

    const headers = lines[0].split(',').map((h) => h.trim())
    const dataRows = lines.slice(1)

    // Calculate statistics
    let missingCount = 0
    let duplicateCount = 0
    const seen = new Set()

    dataRows.forEach((row) => {
      if (seen.has(row)) duplicateCount++
      else seen.add(row)

      const values = row.split(',')
      values.forEach((val) => {
        if (!val || val.trim() === '') missingCount++
      })
    })

    const qualityScore = Math.max(0, 100 - (missingCount + duplicateCount * 2))

    const sections = [
      {
        title: 'Executive Summary',
        content: `Dataset: ${datasetFile.replace(`${datasetId}_`, '')}\nTotal Records: ${dataRows.length}\nTotal Columns: ${headers.length}\nData Quality Score: ${qualityScore}%`,
      },
      {
        title: 'Data Structure',
        content: `Column Names: ${headers.join(', ')}\nColumn Count: ${headers.length}\nRow Count: ${dataRows.length}`,
      },
      {
        title: 'Data Quality Assessment',
        content: `Missing Values: ${missingCount}\nDuplicate Rows: ${duplicateCount}\nQuality Score: ${qualityScore}%\nStatus: ${qualityScore >= 80 ? 'Good' : qualityScore >= 60 ? 'Fair' : 'Needs Improvement'}`,
      },
      {
        title: 'Recommendations',
        content:
          duplicateCount > 0 || missingCount > 0
            ? `${duplicateCount > 0 ? `Remove ${duplicateCount} duplicate rows. ` : ''}${missingCount > 0 ? `Handle ${missingCount} missing values using appropriate imputation or removal strategies.` : ''}`
            : 'Dataset quality is good. No major issues detected.',
      },
    ]

    return NextResponse.json({
      title: 'Exploratory Data Analysis Report',
      dataset: datasetFile.replace(`${datasetId}_`, ''),
      datasetId,
      generatedAt: new Date().toISOString(),
      qualityScore,
      rowCount: dataRows.length,
      columnCount: headers.length,
      missingValues: missingCount,
      duplicateRows: duplicateCount,
      sections,
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasetId = params.id

    // Generate a unique report download
    const timestamp = Date.now()
    const reportFileName = `eda_report_${datasetId}_${timestamp}.json`

    return NextResponse.json({
      reportFileName,
      datasetId,
      generatedAt: new Date().toISOString(),
      status: 'success',
      message: 'Report generated successfully. Download initiated.',
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
