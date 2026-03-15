import { GoogleGenerativeAI } from '@google/generative-ai'

export interface InsightRequest {
  datasetName: string
  rowCount: number
  columnCount: number
  columns: Array<{
    name: string
    type: string
    missingCount: number
    uniqueCount: number
  }>
  missingTotal: number
  duplicates: number
  qualityScore: number
}

export interface DataInsight {
  category: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  recommendation?: string
}

export interface InsightsResponse {
  summary: string
  insights: DataInsight[]
  qualityScore: number
  cleaningScript?: string
}

let client: GoogleGenerativeAI | null = null

function initializeGemini() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }
    client = new GoogleGenerativeAI(apiKey)
  }
  return client
}

export async function generateInsights(request: InsightRequest): Promise<InsightsResponse> {
  try {
    const gemini = initializeGemini()
    const model = gemini.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = buildInsightPrompt(request)

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse the response and extract insights
    return parseInsightsResponse(text, request.qualityScore)
  } catch (error) {
    console.error('Error generating insights:', error)
    // Fallback to basic insights if API fails
    return generateBasicInsights(request)
  }
}

function buildInsightPrompt(request: InsightRequest): string {
  const columnInfo = request.columns
    .map((col) => `- ${col.name} (${col.type}): ${col.uniqueCount} unique values, ${col.missingCount} missing`)
    .join('\n')

  return `Analyze this dataset and provide 3-5 key insights and recommendations:

Dataset: ${request.datasetName}
Rows: ${request.rowCount}
Columns: ${request.columnCount}
Missing Values: ${request.missingTotal}
Duplicate Rows: ${request.duplicates}
Quality Score: ${request.qualityScore}%

Column Details:
${columnInfo}

Please provide:
1. A brief summary of the dataset quality and main findings
2. Specific insights about data issues (missing values, duplicates, outliers, etc.)
3. Recommendations for data cleaning and improvement
4. Python code snippet for addressing the main issues

Format your response as JSON with the following structure:
{
  "summary": "Brief overview",
  "insights": [
    {
      "category": "category name",
      "title": "Short title",
      "description": "Description",
      "severity": "info|warning|critical",
      "recommendation": "How to fix it"
    }
  ],
  "cleaningScript": "Python code here"
}`
}

function parseInsightsResponse(text: string, qualityScore: number): InsightsResponse {
  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return generateBasicInsights({ qualityScore } as any)
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      summary: parsed.summary || 'Dataset analysis complete',
      insights: parsed.insights || [],
      qualityScore,
      cleaningScript: parsed.cleaningScript,
    }
  } catch (error) {
    console.error('Error parsing insights response:', error)
    return generateBasicInsights({ qualityScore } as any)
  }
}

function generateBasicInsights(request: any): InsightsResponse {
  const insights: DataInsight[] = []

  if (request.missingTotal > 0) {
    insights.push({
      category: 'data-quality',
      title: 'Missing Values Detected',
      description: `Found ${request.missingTotal} missing values across your dataset.`,
      severity: request.missingTotal > 100 ? 'critical' : 'warning',
      recommendation: 'Use imputation or removal based on the column and your analysis needs.',
    })
  }

  if (request.duplicates > 0) {
    insights.push({
      category: 'duplicates',
      title: 'Duplicate Rows Found',
      description: `Identified ${request.duplicates} duplicate rows.`,
      severity: 'warning',
      recommendation: 'Remove duplicate rows using drop_duplicates() in Python.',
    })
  }

  if (request.qualityScore < 70) {
    insights.push({
      category: 'quality',
      title: 'Low Data Quality Score',
      description: `Your dataset has a quality score of ${request.qualityScore}%, indicating significant data issues.`,
      severity: 'critical',
      recommendation: 'Conduct thorough data cleaning before analysis.',
    })
  }

  const basicScript = `import pandas as pd
import numpy as np

# Load and clean data
df = pd.read_csv('your_data.csv')
df = df.drop_duplicates()
df.dropna(inplace=True)

print("Data cleaning complete")
print(df.info())`

  return {
    summary: `Dataset contains ${request.rowCount} rows and ${request.columnCount} columns. Found ${request.missingTotal} missing values and ${request.duplicates} duplicates.`,
    insights,
    qualityScore: request.qualityScore,
    cleaningScript: basicScript,
  }
}
