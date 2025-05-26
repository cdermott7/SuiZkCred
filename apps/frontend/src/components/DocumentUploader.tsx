'use client';

import { useState, useRef } from 'react';
import { analyzeDocumentWithAI, analyzeImageDocument, DocumentAnalysis, CREDENTIAL_TYPES } from '../services/aiCategorization';

interface DocumentUploaderProps {
  onUploadComplete: (file: File, preview: string, analysis: DocumentAnalysis) => void;
  label?: string;
  supportedDocuments?: string[];
}

// Helper function to create a File object from an SVG path
const createSampleFile = async (path: string, name: string, type: string): Promise<File> => {
  const response = await fetch(path);
  const blob = await response.blob();
  return new File([blob], name, { type });
};

export default function DocumentUploader({
  onUploadComplete,
  label = "Upload Verification Document",
  supportedDocuments = ["Passport", "Driver's License", "National ID Card"]
}: DocumentUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState(supportedDocuments[0]);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFile = async (file: File) => {
    setError(null);
    setAnalysis(null);
    setShowAnalysis(false);
    
    // Check file type - accept only images and PDFs
    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
      setError("Please upload an image or PDF file");
      return;
    }
    
    // Check file size (limit to 5MB)
    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760');
    if (file.size > maxSize) {
      setError(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`);
      return;
    }
    
    setSelectedFile(file);
    
    // Generate preview for images only
    if (file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDFs, show a generic icon
      setPreview('/file.svg');
    }

    // Start AI analysis
    setIsAnalyzing(true);
    try {
      let documentAnalysis: DocumentAnalysis;
      
      if (file.type.match('image.*')) {
        // Analyze image documents
        documentAnalysis = await analyzeImageDocument(file);
      } else {
        // For PDFs, extract text first (simplified for demo)
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          documentAnalysis = await analyzeDocumentWithAI(
            `PDF document: ${file.name}. Content analysis would be done here in production.`,
            file.type,
            file.name
          );
          setAnalysis(documentAnalysis);
          setShowAnalysis(true);
        };
        reader.readAsText(file);
        return;
      }
      
      setAnalysis(documentAnalysis);
      setShowAnalysis(true);
      
      // Auto-update document type based on AI analysis
      const credentialType = CREDENTIAL_TYPES.find(t => t.id === documentAnalysis.credentialType);
      if (credentialType) {
        setDocumentType(credentialType.name);
      }
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      setError('Document analysis failed. You can still proceed manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleButtonClick = () => {
    inputRef.current?.click();
  };
  
  const handleSubmit = () => {
    if (selectedFile && preview && analysis) {
      onUploadComplete(selectedFile, preview, analysis);
    }
  };
  
  return (
    <div className="w-full">
      <div className="p-3 mb-4 text-sm text-yellow-700 bg-yellow-50 rounded-md border border-yellow-200 flex items-start">
        <svg className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm text-yellow-800 font-medium">
          <span className="font-bold">Demo feature only:</span> Documents uploaded here are not actually verified for authenticity. This is a simulation to demonstrate the user flow.
        </p>
      </div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Document type selector */}
      <div className="mb-4">
        <label htmlFor="documentType" className="block text-sm font-medium text-gray-500 mb-1">
          Document Type
        </label>
        <select
          id="documentType"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          {supportedDocuments.map((doc) => (
            <option key={doc} value={doc}>{doc}</option>
          ))}
        </select>
      </div>
      
      {/* File drop area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50' 
            : selectedFile 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf"
          onChange={handleChange}
        />
        
        {!selectedFile ? (
          <div>
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Drag & drop a file here, or click to select
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: JPG, PNG, PDF (max 5MB)
            </p>
            
            {/* Quick sample buttons */}
            <div className="mt-4 flex justify-center space-x-3">
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const file = await createSampleFile('/sample-passport.svg', 'passport.svg', 'image/svg+xml');
                    await handleFile(file);
                  } catch (error) {
                    console.error('Failed to load sample document:', error);
                  }
                }}
                className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
              >
                Use Sample Passport
              </button>
              
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const file = await createSampleFile('/sample-drivers-license.svg', 'license.svg', 'image/svg+xml');
                    await handleFile(file);
                  } catch (error) {
                    console.error('Failed to load sample document:', error);
                  }
                }}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
              >
                Use Sample License
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {preview && preview.startsWith('data:image') ? (
              <img 
                src={preview} 
                alt="Document preview" 
                className="max-h-48 mx-auto object-contain rounded-md"
              />
            ) : (
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB - {selectedFile.type}
              </p>
            </div>
            <button 
              type="button"
              className="text-xs text-indigo-600 hover:text-indigo-800"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                setPreview(null);
              }}
            >
              Remove file
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* AI Analysis Loading */}
      {isAnalyzing && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-sm text-blue-800 font-medium">Analyzing document with AI...</p>
          </div>
          <p className="text-xs text-blue-600 mt-1">This may take a few seconds</p>
        </div>
      )}

      {/* AI Analysis Results */}
      {showAnalysis && analysis && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start justify-between">
            <div className="flex">
              <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-green-800">AI Analysis Complete</h4>
                <p className="text-sm text-green-700 mt-1">
                  <span className="font-medium">Detected:</span> {analysis.credentialTypeName}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <span className="font-medium">Confidence:</span> {(analysis.confidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAnalysis(false)}
              className="text-green-400 hover:text-green-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {analysis.reasoning && (
            <p className="text-xs text-green-600 mt-2">
              <span className="font-medium">Reasoning:</span> {analysis.reasoning}
            </p>
          )}

          {Object.keys(analysis.extractedData).length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-green-800 mb-1">Extracted Information:</p>
              <div className="grid grid-cols-1 gap-1">
                {Object.entries(analysis.extractedData).map(([key, value]) => (
                  <p key={key} className="text-xs text-green-700">
                    <span className="font-medium capitalize">{key}:</span> {String(value)}
                  </p>
                ))}
              </div>
            </div>
          )}

          {analysis.suggestedActions && analysis.suggestedActions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-green-800 mb-1">Suggested Actions:</p>
              <ul className="text-xs text-green-700 list-disc list-inside">
                {analysis.suggestedActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {selectedFile && !isAnalyzing && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!analysis}
            className={`w-full px-4 py-2 text-sm font-medium border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              analysis 
                ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' 
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            }`}
          >
            {analysis ? 'Create Credential' : 'Analyzing Document...'}
          </button>
          
          {analysis && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Will create a {analysis.credentialTypeName} credential on Sui blockchain
            </p>
          )}
        </div>
      )}
    </div>
  );
}