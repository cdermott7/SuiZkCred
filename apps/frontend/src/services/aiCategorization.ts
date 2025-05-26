'use client';

/**
 * AI Document Categorization Service
 * Uses AI to analyze and categorize uploaded documents into credential types
 */

export interface DocumentAnalysis {
  credentialType: number;
  credentialTypeName: string;
  confidence: number;
  extractedData: Record<string, any>;
  reasoning: string;
  suggestedActions?: string[];
}

export interface CredentialTypeInfo {
  id: number;
  name: string;
  description: string;
  requiredFields: string[];
  examples: string[];
}

// Credential types from the smart contract
export const CREDENTIAL_TYPES: CredentialTypeInfo[] = [
  {
    id: 1,
    name: 'Email',
    description: 'Email verification credential',
    requiredFields: ['email', 'domain'],
    examples: ['email confirmation', 'email verification', 'account activation']
  },
  {
    id: 2,
    name: 'Basic KYC',
    description: 'Basic Know Your Customer verification',
    requiredFields: ['name', 'dateOfBirth', 'address'],
    examples: ['basic identity verification', 'simple KYC', 'account verification']
  },
  {
    id: 3,
    name: 'Advanced KYC',
    description: 'Advanced Know Your Customer verification',
    requiredFields: ['name', 'dateOfBirth', 'address', 'idNumber', 'photo'],
    examples: ['enhanced identity verification', 'full KYC', 'compliance verification']
  },
  {
    id: 4,
    name: 'DAO Membership',
    description: 'Decentralized Autonomous Organization membership',
    requiredFields: ['walletAddress', 'membershipLevel', 'votingPower'],
    examples: ['DAO member certificate', 'governance token holder', 'voting rights']
  },
  {
    id: 5,
    name: 'Education',
    description: 'Educational credentials and certificates',
    requiredFields: ['institution', 'degree', 'graduationDate', 'gpa'],
    examples: ['diploma', 'degree certificate', 'course completion', 'academic transcript']
  },
  {
    id: 6,
    name: 'Passport',
    description: 'Passport and travel document verification',
    requiredFields: ['passportNumber', 'nationality', 'issueDate', 'expiryDate'],
    examples: ['passport', 'travel document', 'immigration document']
  },
  {
    id: 7,
    name: 'Driver License',
    description: 'Driving license verification',
    requiredFields: ['licenseNumber', 'issueDate', 'expiryDate', 'class'],
    examples: ['driving license', 'driver permit', 'motor vehicle license']
  },
  {
    id: 8,
    name: 'National ID',
    description: 'National identity document verification',
    requiredFields: ['idNumber', 'nationality', 'issueDate'],
    examples: ['national ID card', 'citizen ID', 'identity card', 'social security']
  },
  {
    id: 9,
    name: 'Proof of Address',
    description: 'Address verification document',
    requiredFields: ['address', 'issueDate', 'issuer'],
    examples: ['utility bill', 'bank statement', 'lease agreement', 'tax document']
  }
];

/**
 * Analyze document content using AI to determine credential type
 */
export async function analyzeDocumentWithAI(
  content: string,
  fileType: string,
  fileName: string
): Promise<DocumentAnalysis> {
  
  try {
    // Call our API route for document analysis
    const response = await fetch('/api/analyze-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        fileType,
        fileName
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const analysis = await response.json();
    return analysis;

  } catch (error) {
    console.warn('AI analysis failed, using pattern-based fallback:', error);
    // Fallback to pattern-based analysis
    return analyzeWithPatterns(content, fileType, fileName);
  }
}

/**
 * Use AI provider to analyze document
 */
async function analyzeWithProvider(
  provider: string,
  apiKey: string,
  content: string,
  fileType: string,
  fileName: string
): Promise<DocumentAnalysis> {
  
  const prompt = createAnalysisPrompt(content, fileType, fileName);
  
  let response: any;
  
  switch (provider) {
    case 'openai':
      response = await callOpenAI(apiKey, prompt);
      break;
    case 'anthropic':
      response = await callAnthropic(apiKey, prompt);
      break;
    case 'google':
      response = await callGoogleAI(apiKey, prompt);
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  return parseAIResponse(response);
}

/**
 * OpenAI API call
 */
async function callOpenAI(apiKey: string, prompt: string): Promise<any> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a document analysis expert specializing in credential verification. Analyze documents and categorize them into the appropriate credential types.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Anthropic API call
 */
async function callAnthropic(apiKey: string, prompt: string): Promise<any> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Google AI API call
 */
async function callGoogleAI(apiKey: string, prompt: string): Promise<any> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Google AI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Create analysis prompt for AI
 */
function createAnalysisPrompt(content: string, fileType: string, fileName: string): string {
  return `
Analyze the following document and categorize it into one of these credential types:

${CREDENTIAL_TYPES.map(type => `${type.id}. ${type.name}: ${type.description}`).join('\n')}

Document Information:
- File Name: ${fileName}
- File Type: ${fileType}
- Content: ${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

Please respond in the following JSON format:
{
  "credentialType": <number 1-9>,
  "credentialTypeName": "<name>",
  "confidence": <number 0-1>,
  "extractedData": {
    // Key-value pairs of extracted information
  },
  "reasoning": "<explanation of why this category was chosen>",
  "suggestedActions": ["<action1>", "<action2>"]
}

Focus on identifying key information like:
- Names, addresses, dates
- ID numbers, license numbers
- Institution names, educational details
- Government/official stamps or logos
- Document structure and format
`;
}

/**
 * Parse AI response into DocumentAnalysis
 */
function parseAIResponse(response: string): DocumentAnalysis {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response
      if (!parsed.credentialType || !parsed.credentialTypeName) {
        throw new Error('Invalid AI response format');
      }
      
      return {
        credentialType: parsed.credentialType,
        credentialTypeName: parsed.credentialTypeName,
        confidence: parsed.confidence || 0.5,
        extractedData: parsed.extractedData || {},
        reasoning: parsed.reasoning || 'AI analysis completed',
        suggestedActions: parsed.suggestedActions || []
      };
    }
    
    throw new Error('No JSON found in AI response');
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    // Fallback to pattern-based analysis
    return analyzeWithPatterns(response, '', '');
  }
}

/**
 * Fallback pattern-based analysis when AI is not available
 */
function analyzeWithPatterns(content: string, fileType: string, fileName: string): DocumentAnalysis {
  const lowercaseContent = content.toLowerCase();
  const lowercaseFileName = fileName.toLowerCase();
  
  // Pattern matching for different document types
  const patterns = [
    {
      type: 6, // Passport
      patterns: ['passport', 'travel document', 'immigration', 'visa', 'border'],
      fields: ['passport number', 'nationality', 'place of birth']
    },
    {
      type: 7, // Driver License
      patterns: ['driver', 'driving', 'license', 'permit', 'motor vehicle', 'dmv'],
      fields: ['license number', 'class', 'endorsements']
    },
    {
      type: 8, // National ID
      patterns: ['national id', 'identity card', 'citizen', 'social security', 'government id'],
      fields: ['id number', 'citizenship', 'place of birth']
    },
    {
      type: 5, // Education
      patterns: ['diploma', 'degree', 'certificate', 'graduation', 'university', 'college', 'school'],
      fields: ['institution', 'degree', 'major', 'gpa']
    },
    {
      type: 9, // Proof of Address
      patterns: ['utility', 'bill', 'statement', 'invoice', 'lease', 'mortgage', 'tax'],
      fields: ['address', 'account number', 'billing date']
    },
    {
      type: 1, // Email
      patterns: ['email', 'verification', 'confirmation', '@', 'activate'],
      fields: ['email address', 'verification code']
    }
  ];

  for (const pattern of patterns) {
    const matches = pattern.patterns.filter(p => 
      lowercaseContent.includes(p) || lowercaseFileName.includes(p)
    );
    
    if (matches.length > 0) {
      const credType = CREDENTIAL_TYPES.find(t => t.id === pattern.type)!;
      
      return {
        credentialType: pattern.type,
        credentialTypeName: credType.name,
        confidence: Math.min(0.9, matches.length * 0.3 + 0.3),
        extractedData: extractBasicData(content, pattern.fields),
        reasoning: `Pattern matching found keywords: ${matches.join(', ')}`,
        suggestedActions: ['Verify extracted information', 'Upload supporting documents']
      };
    }
  }

  // Default to Basic KYC if no patterns match
  return {
    credentialType: 2,
    credentialTypeName: 'Basic KYC',
    confidence: 0.3,
    extractedData: extractBasicData(content, ['name', 'date', 'address']),
    reasoning: 'No specific patterns detected, defaulting to Basic KYC',
    suggestedActions: ['Review document manually', 'Select correct credential type']
  };
}

/**
 * Extract basic data from content using simple regex patterns
 */
function extractBasicData(content: string, fields: string[]): Record<string, any> {
  const extracted: Record<string, any> = {};
  
  // Simple extraction patterns
  const patterns = {
    email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    date: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
    numbers: /(\d{4,})/g,
    phone: /(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g
  };

  fields.forEach(field => {
    const fieldLower = field.toLowerCase();
    
    if (fieldLower.includes('email') && patterns.email.test(content)) {
      extracted.email = content.match(patterns.email)?.[0];
    }
    
    if (fieldLower.includes('date') && patterns.date.test(content)) {
      extracted.dates = content.match(patterns.date) || [];
    }
    
    if (fieldLower.includes('number') && patterns.numbers.test(content)) {
      extracted.numbers = content.match(patterns.numbers) || [];
    }
    
    if (fieldLower.includes('phone') && patterns.phone.test(content)) {
      extracted.phone = content.match(patterns.phone)?.[0];
    }
  });

  return extracted;
}

/**
 * Analyze image using OCR and AI
 */
export async function analyzeImageDocument(file: File): Promise<DocumentAnalysis> {
  try {
    // Convert image to base64 for AI analysis
    const base64 = await fileToBase64(file);
    
    // Use browser's OCR capabilities or external service
    const extractedText = await extractTextFromImage(base64);
    
    // Analyze the extracted text
    return await analyzeDocumentWithAI(extractedText, file.type, file.name);
    
  } catch (error) {
    console.error('Image analysis failed:', error);
    
    // Fallback analysis based on filename and file type
    return analyzeWithPatterns('', file.type, file.name);
  }
}

/**
 * Convert file to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Extract text from image using OCR
 * In a production app, you would use a proper OCR service like Tesseract.js or Google Vision API
 */
async function extractTextFromImage(base64: string): Promise<string> {
  // For demo purposes, return a placeholder
  // In production, integrate with Tesseract.js or similar OCR library
  return `[OCR would extract text from image here]
  
Sample extracted content based on image analysis:
- Document type appears to be an identity document
- Contains dates, numbers, and official formatting
- May contain personal information like name and address`;
}

/**
 * Get credential type information
 */
export function getCredentialTypeInfo(credentialType: number): CredentialTypeInfo | undefined {
  return CREDENTIAL_TYPES.find(type => type.id === credentialType);
}