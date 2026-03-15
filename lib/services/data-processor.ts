import Papa from 'papaparse'

export interface DataProfile {
  rows: number
  columns: number
  columnNames: string[]
  columnTypes: Record<string, string>
  missingCounts: Record<string, number>
  uniqueCounts: Record<string, number>
}

export async function processCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('Failed to parse CSV'))
        } else {
          resolve(results.data)
        }
      },
      error: (error) => {
        reject(error)
      },
      header: true,
      skipEmptyLines: true,
    })
  })
}

export async function processJSON(file: File): Promise<any[]> {
  const text = await file.text()
  try {
    const data = JSON.parse(text)
    if (Array.isArray(data)) {
      return data
    } else {
      throw new Error('JSON must contain an array')
    }
  } catch (error) {
    throw new Error('Failed to parse JSON')
  }
}

export function analyzeDataProfile(data: any[]): DataProfile {
  if (!data || data.length === 0) {
    return {
      rows: 0,
      columns: 0,
      columnNames: [],
      columnTypes: {},
      missingCounts: {},
      uniqueCounts: {},
    }
  }

  const firstRow = data[0]
  const columnNames = Object.keys(firstRow)
  const columnTypes: Record<string, string> = {}
  const missingCounts: Record<string, number> = {}
  const uniqueCounts: Record<string, number> = {}
  const uniqueValues: Record<string, Set<string>> = {}

  columnNames.forEach((col) => {
    missingCounts[col] = 0
    uniqueValues[col] = new Set()
  })

  // Analyze each row
  data.forEach((row) => {
    columnNames.forEach((col) => {
      const value = row[col]

      // Track missing values
      if (value === null || value === undefined || value === '') {
        missingCounts[col]++
      } else {
        uniqueValues[col].add(String(value))
      }

      // Infer column type (first pass)
      if (!columnTypes[col]) {
        columnTypes[col] = inferType(value)
      }
    })
  })

  // Convert unique value sets to counts
  columnNames.forEach((col) => {
    uniqueCounts[col] = uniqueValues[col].size
  })

  return {
    rows: data.length,
    columns: columnNames.length,
    columnNames,
    columnTypes,
    missingCounts,
    uniqueCounts,
  }
}

export function inferType(value: any): string {
  if (value === null || value === undefined || value === '') {
    return 'unknown'
  }

  const str = String(value).toLowerCase().trim()

  // Check for boolean
  if (str === 'true' || str === 'false') {
    return 'boolean'
  }

  // Check for number
  if (!isNaN(Number(value)) && value !== '') {
    return Number.isInteger(Number(value)) ? 'integer' : 'float'
  }

  // Check for date
  if (isValidDate(value)) {
    return 'date'
  }

  return 'string'
}

export function isValidDate(value: any): boolean {
  const dateString = String(value)
  const timestamp = Date.parse(dateString)
  return !isNaN(timestamp)
}

export function detectDuplicates(data: any[]): number {
  const seen = new Set()
  let duplicateCount = 0

  data.forEach((row) => {
    const hash = JSON.stringify(row)
    if (seen.has(hash)) {
      duplicateCount++
    } else {
      seen.add(hash)
    }
  })

  return duplicateCount
}

export function calculateStatistics(data: any[], column: string): any {
  const values = data
    .map((row) => row[column])
    .filter((val) => val !== null && val !== undefined && val !== '')
    .map((val) => Number(val))
    .filter((val) => !isNaN(val))

  if (values.length === 0) {
    return null
  }

  values.sort((a, b) => a - b)

  const sum = values.reduce((a, b) => a + b, 0)
  const mean = sum / values.length
  const median = values[Math.floor(values.length / 2)]

  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const std = Math.sqrt(variance)

  return {
    mean: parseFloat(mean.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    std: parseFloat(std.toFixed(2)),
    min: values[0],
    max: values[values.length - 1],
    q1: values[Math.floor(values.length / 4)],
    q3: values[Math.floor((values.length * 3) / 4)],
  }
}
