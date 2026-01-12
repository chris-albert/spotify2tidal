import { useState } from 'react'
import type { MigrationExport, TrackMatchResult } from '@spotify2tidal/types'
import {
  downloadAsJSON,
  downloadAsText,
  downloadAsCSV,
  copyToClipboard,
  generateTextReport,
} from '@/lib/utils/exportUtils'

interface ExportActionsProps {
  exportData: MigrationExport
  trackMatches: TrackMatchResult[]
  className?: string
}

/**
 * ExportActions - Action buttons for export functionality
 *
 * Provides:
 * - Download as JSON
 * - Download as Text Report
 * - Download as CSV
 * - Copy to Clipboard
 * - Print Report
 */
export default function ExportActions({
  exportData,
  trackMatches,
  className = '',
}: ExportActionsProps) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleDownloadJSON = () => {
    setDownloading(true)
    try {
      downloadAsJSON(exportData)
      setTimeout(() => setDownloading(false), 1000)
    } catch (error) {
      console.error('Failed to download JSON:', error)
      alert('Failed to download JSON file')
      setDownloading(false)
    }
  }

  const handleDownloadText = () => {
    setDownloading(true)
    try {
      downloadAsText(exportData)
      setTimeout(() => setDownloading(false), 1000)
    } catch (error) {
      console.error('Failed to download text:', error)
      alert('Failed to download text report')
      setDownloading(false)
    }
  }

  const handleDownloadCSV = () => {
    setDownloading(true)
    try {
      downloadAsCSV(trackMatches)
      setTimeout(() => setDownloading(false), 1000)
    } catch (error) {
      console.error('Failed to download CSV:', error)
      alert('Failed to download CSV file')
      setDownloading(false)
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      await copyToClipboard(exportData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      alert('Failed to copy to clipboard')
    }
  }

  const handlePrint = () => {
    const report = generateTextReport(exportData)

    // Create a new window for printing
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) {
      alert('Failed to open print window. Please check your popup blocker.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spotify2Tidal Migration Report</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              white-space: pre-wrap;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>${report}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">Export Options</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Download JSON */}
          <button
            onClick={handleDownloadJSON}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Download JSON</span>
          </button>

          {/* Download Text Report */}
          <button
            onClick={handleDownloadText}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Download Report</span>
          </button>

          {/* Download CSV */}
          <button
            onClick={handleDownloadCSV}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Download CSV</span>
          </button>

          {/* Copy to Clipboard */}
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            {copied ? (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>

        {/* File format descriptions */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            File Formats
          </h4>
          <ul className="space-y-1.5 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="font-medium text-blue-600">JSON:</span>
              <span>
                Complete migration data. Use for future import when Tidal API is
                ready.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-green-600">Report:</span>
              <span>
                Human-readable text report with statistics and playlist
                details.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-purple-600">CSV:</span>
              <span>
                Spreadsheet-compatible format. Import into Excel or Google
                Sheets.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Additional actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">Additional Actions</h3>

        <div className="space-y-3">
          {/* Print Report */}
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span>Print Report</span>
          </button>

          {/* View JSON Preview */}
          <details className="group">
            <summary className="cursor-pointer px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                <span>View JSON Preview</span>
              </span>
              <svg
                className="w-5 h-5 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="mt-2 p-4 bg-gray-900 rounded-lg overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono">
                {JSON.stringify(exportData, null, 2).slice(0, 1000)}...
              </pre>
              <p className="text-xs text-gray-400 mt-2">
                Preview truncated. Download full JSON to see all data.
              </p>
            </div>
          </details>
        </div>
      </div>

      {/* Important notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">
              Save Your Export
            </h4>
            <p className="text-sm text-yellow-800">
              Tidal's API currently does not support playlist creation. Save your
              export file for future use when the API is complete. You can also
              use it to manually create playlists on Tidal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
