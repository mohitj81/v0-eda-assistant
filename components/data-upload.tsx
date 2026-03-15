'use client'

import { useState } from 'react'
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function DataUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFiles = async (files: FileList) => {
    const file = files[0]
    if (!file) return

    // Validate file type
    const validTypes = ['text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV, JSON, or Excel file.')
      return
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File is too large. Maximum size is 50MB.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      setSuccess(true)

      // Redirect to analysis page after 1 second
      setTimeout(() => {
        router.push(`/analysis/${data.datasetId}`)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Dataset</CardTitle>
        <CardDescription>Upload a CSV, JSON, or Excel file for exploratory data analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">File uploaded successfully! Redirecting to analysis...</AlertDescription>
          </Alert>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <input
            type="file"
            onChange={handleFileInput}
            accept=".csv,.json,.xlsx,.xls"
            disabled={isLoading}
            className="hidden"
            id="file-upload"
          />

          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className={`mx-auto h-12 w-12 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="mt-4 text-base font-medium">Drag and drop your file here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </label>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Supported formats:</p>
          <ul className="mt-2 space-y-1">
            <li>• CSV (.csv)</li>
            <li>• JSON (.json)</li>
            <li>• Excel (.xlsx, .xls)</li>
          </ul>
          <p className="mt-3">Maximum file size: 50MB</p>
        </div>
      </CardContent>
    </Card>
  )
}
