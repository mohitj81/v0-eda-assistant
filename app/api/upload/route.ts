import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Simple CSV parser for server-side processing
function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter((line) => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  const data: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const row: any = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    data.push(row)
  }

  return data
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/json',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a CSV file.' }, { status: 400 })
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 })
    }

    // Generate unique ID for dataset
    const datasetId = `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadsDir, `${datasetId}_${file.name}`)
    await writeFile(filePath, buffer)

    // Parse file to extract metadata
    let data: any[] = []
    let stats = {
      rows: 0,
      columns: 0,
      missingValues: 0,
      duplicates: 0,
    }

    try {
      const content = buffer.toString('utf-8')

      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        data = parseCSV(content)
      } else if (file.type === 'application/json') {
        data = JSON.parse(content)
        if (!Array.isArray(data)) {
          data = [data]
        }
      }

      // Calculate basic statistics from real data
      if (data.length > 0) {
        const columns = Object.keys(data[0])
        stats.rows = data.length
        stats.columns = columns.length

        let missingCount = 0
        const seen = new Set()

        data.forEach((row) => {
          const rowStr = JSON.stringify(row)
          if (seen.has(rowStr)) {
            stats.duplicates++
          } else {
            seen.add(rowStr)
          }

          Object.values(row).forEach((val) => {
            if (val === null || val === undefined || val === '') {
              missingCount++
            }
          })
        })

        stats.missingValues = missingCount
      }
    } catch (parseError) {
      console.error('Error parsing file:', parseError)
    }

    return NextResponse.json({
      datasetId,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      stats,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}