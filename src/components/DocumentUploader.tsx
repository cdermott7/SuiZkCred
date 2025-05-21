'use client';

import { useState, useRef } from 'react';

interface DocumentUploaderProps {
  onUploadComplete: (file: File, preview: string, documentType: string) => void;
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
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFile = (file: File) => {
    setError(null);
    
    // Check file type - accept only images and PDFs
    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
      setError("Please upload an image or PDF file");
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
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
    if (selectedFile && preview) {
      onUploadComplete(selectedFile, preview, documentType);
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
                    handleFile(file);
                    if (onUploadComplete) {
                      onUploadComplete(file, '/sample-passport.svg', 'Passport');
                    }
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
                    handleFile(file);
                    if (onUploadComplete) {
                      onUploadComplete(file, '/sample-drivers-license.svg', "Driver's License");
                    }
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
      
      {selectedFile && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Verify Document
          </button>
        </div>
      )}
    </div>
  );
}