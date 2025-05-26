import { NextRequest, NextResponse } from 'next/server';

interface AnalysisRequest {
  content: string;
  fileType: string;
  fileName: string;
}

const CREDENTIAL_TYPES = [
  { id: 1, name: 'Email', description: 'Email verification credential' },
  { id: 2, name: 'Basic KYC', description: 'Basic Know Your Customer verification' },
  { id: 3, name: 'Advanced KYC', description: 'Advanced Know Your Customer verification' },
  { id: 4, name: 'DAO Membership', description: 'Decentralized Autonomous Organization membership' },
  { id: 5, name: 'Education', description: 'Educational credentials and certificates' },
  { id: 6, name: 'Passport', description: 'Passport and travel document verification' },
  { id: 7, name: 'Driver License', description: 'Driving license verification' },
  { id: 8, name: 'National ID', description: 'National identity document verification' },
  { id: 9, name: 'Proof of Address', description: 'Address verification document' }
];

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

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { content, fileType, fileName } = body;

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      // Return pattern-based analysis if no API key
      return NextResponse.json(analyzeWithPatterns(content, fileType, fileName));
    }

    // Call OpenAI API
    const prompt = createAnalysisPrompt(content, fileType, fileName);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-4',
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
    const aiResponse = data.choices[0].message.content;

    // Parse AI response
    const analysis = parseAIResponse(aiResponse);
    
    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Document analysis failed:', error);
    
    // Return pattern-based analysis as fallback
    const body: AnalysisRequest = await request.json();
    const fallbackAnalysis = analyzeWithPatterns(body.content, body.fileType, body.fileName);
    
    return NextResponse.json(fallbackAnalysis);
  }
}

function parseAIResponse(response: string): any {
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

function analyzeWithPatterns(content: string, fileType: string, fileName: string): any {
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