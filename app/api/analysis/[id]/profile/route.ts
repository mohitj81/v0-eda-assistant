import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

function inferType(value: string): string {
  if (!value || value.trim() === '') return 'unknown'
  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return 'boolean'
  if (!isNaN(Number(value)) && value !== '') return Number.isInteger(Number(value)) ? 'integer' : 'float'
  if (!isNaN(Date.parse(value)) && isNaN(Number(value))) return 'date'
  return 'string'
}

function getTopValues(values: string[], limit: number = 10) {
  const counts: Record<string, number> = {}
  values.forEach((v) => {
    if (v) counts[v] = (counts[v] || 0) + 1
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }))
}

function calculateStats(values: number[]) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  const mean = sum / sorted.length
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2
  const variance =
    sorted.reduce((s, val) => s + Math.pow(val - mean, 2), 0) / sorted.length
  const std = Math.sqrt(variance)
  return {
    mean: parseFloat(mean.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    std: parseFloat(std.toFixed(2)),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    q1: sorted[Math.floor(sorted.length * 0.25)],
    q3: sorted[Math.floor(sorted.length * 0.75)],
  }
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
        columns: [],
        rowCount: 0,
        columnCount: 0,
        missingTotal: 0,
        duplicateRows: 0,
      })
    }

    const filePath = join(uploadsDir, datasetFile)
    const content = await readFile(filePath, 'utf-8')
    const lines = content.split('\n').filter((l) => l.trim())

    if (lines.length < 1) {
      return NextResponse.json({
        columns: [],
        rowCount: 0,
        columnCount: 0,
        missingTotal: 0,
        duplicateRows: 0,
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

    const columns = headers.map((header) => {
      const columnValues = dataRows.map((row) => row[header] || '')
      const nonEmptyValues = columnValues.filter((v) => v !== '')
      const missing = columnValues.filter((v) => v === '').length
      const unique = new Set(nonEmptyValues).size

      const typeValue = nonEmptyValues.find((v) => v !== '')
      const type = typeValue ? inferType(typeValue) : 'unknown'

      let stats = null
      if (type === 'integer' || type === 'float') {
        const numericValues = nonEmptyValues.map(Number).filter((n) => !isNaN(n))
        stats = calculateStats(numericValues)
      }

      return {
        name: header,
        type,
        missing,
        missingPct: parseFloat(((missing / columnValues.length) * 100).toFixed(2)),
        unique,
        duplicates: 0,
        stats,
        topValues: getTopValues(nonEmptyValues),
      }
    })

    const missingTotal = columns.reduce((sum, col) => sum + col.missing, 0)

    const seen = new Set()
    let duplicateRows = 0
    dataRows.forEach((row) => {
      const hash = JSON.stringify(row)
      if (seen.has(hash)) duplicateRows++
      else seen.add(hash)
    })

    return NextResponse.json({
      columns,
      rowCount: dataRows.length,
      columnCount: headers.length,
      missingTotal,
      duplicateRows,
    })
  } catch (error) {
    console.error('Error loading profile:', error)
    return NextResponse.json(
      { error: 'Failed to load profile' },
      { status: 500 }
    )
  }
}