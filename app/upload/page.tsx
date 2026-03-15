'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { ArrowLeft, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function UploadPage() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    const validTypes = [
      'text/csv',
      'application/json',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      toast.error('Invalid file type. Please upload CSV, JSON, or Excel files.')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 50MB.')
      return
    }

    setSelectedFile(file)
    toast.success(`File selected: ${file.name}`)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      toast.success('File uploaded successfully')
      router.push(`/analysis/${data.datasetId}`)
    } catch (error) {
      toast.error('Failed to upload file')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm hover:text-primary transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Your Dataset</h1>
          <p className="text-muted-foreground">
            Upload your data and let our AI analyze it for insights and quality metrics
          </p>
        </div>

        <Card className="p-8 mb-8">
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Drag and drop your file here</h3>
            <p className="text-sm text-muted-foreground mb-6">or click the button below to select</p>

            <input
              type="file"
              accept=".csv,.json,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button asChild variant="outline">
                <span>Select File</span>
              </Button>
            </label>
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="mt-8 p-4 bg-secondary rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  onClick={() => setSelectedFile(null)}
                  variant="ghost"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-8 flex gap-4">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
              className="gap-2"
              size="lg"
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              {isLoading ? 'Uploading...' : 'Upload and Analyze'}
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/">Cancel</Link>
            </Button>
          </div>
        </Card>

        {/* Supported Formats */}
        <Card className="p-6 bg-secondary/30">
          <h3 className="font-semibold mb-4">Supported Formats</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              CSV files
            </li>
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              JSON files
            </li>
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Excel (.xlsx, .xls)
            </li>
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Max 50MB file size
            </li>
          </ul>
        </Card>
      </div>
    </main>
  )
}
