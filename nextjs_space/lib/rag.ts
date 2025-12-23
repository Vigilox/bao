/**
 * RAG (Retrieval-Augmented Generation) Utilities
 * Handles document processing, embeddings, and semantic search
 */

import { prisma } from './db';

/**
 * Chunk text into manageable pieces for embedding
 */
export function chunkText(
  text: string,
  options: {
    chunkSize?: number;
    overlap?: number;
  } = {}
): Array<{ content: string; metadata: { start: number; end: number } }> {
  const chunkSize = options?.chunkSize || 1000;
  const overlap = options?.overlap || 200;
  
  const chunks: Array<{ content: string; metadata: { start: number; end: number } }> = [];
  
  // Split by paragraphs first for better semantic boundaries
  const paragraphs = (text || '').split(/\n\s*\n/);
  let currentChunk = '';
  let currentStart = 0;
  
  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph?.trim();
    if (!trimmedPara) continue;
    
    if ((currentChunk.length + trimmedPara.length) > chunkSize && currentChunk) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          start: currentStart,
          end: currentStart + currentChunk.length,
        },
      });
      
      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + '\n\n' + trimmedPara;
      currentStart += currentChunk.length - overlap;
    } else {
      // Add to current chunk
      if (currentChunk) {
        currentChunk += '\n\n' + trimmedPara;
      } else {
        currentChunk = trimmedPara;
      }
    }
  }
  
  // Add final chunk
  if (currentChunk?.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        start: currentStart,
        end: currentStart + currentChunk.length,
      },
    });
  }
  
  return chunks;
}

/**
 * Generate embeddings for text using LLM API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://apps.abacus.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small', // OpenAI compatible
      }),
    });

    if (!response?.ok) {
      throw new Error(`Embedding API failed: ${response?.status}`);
    }

    const data = await response.json();
    return data?.data?.[0]?.embedding || [];
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i] ?? 0;
    const b = vecB[i] ?? 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Process document and create embeddings
 */
export async function processDocument(documentId: string): Promise<boolean> {
  try {
    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || !document?.extractedText) {
      return false;
    }

    // Chunk the text
    const chunks = chunkText(document.extractedText);

    // Generate embeddings and save chunks
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk?.content);
      
      if (embedding?.length > 0) {
        await prisma.documentChunk.create({
          data: {
            documentId,
            content: chunk.content,
            embedding: embedding, // Store as JSON array
            metadata: chunk.metadata,
          },
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error processing document:', error);
    return false;
  }
}

/**
 * Retrieve relevant document chunks based on query
 */
export async function retrieveRelevantChunks(
  projectId: string,
  query: string,
  options: {
    limit?: number;
    threshold?: number;
  } = {}
): Promise<Array<{ content: string; similarity: number; documentId: string }>> {
  try {
    const limit = options?.limit || 5;
    const threshold = options?.threshold || 0.7;

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    if (!queryEmbedding?.length) {
      return [];
    }

    // Get all document chunks for this project
    const documents = await prisma.document.findMany({
      where: { projectId },
      include: {
        documentChunks: true,
      },
    });

    // Calculate similarity for each chunk
    const results: Array<{
      content: string;
      similarity: number;
      documentId: string;
    }> = [];

    for (const doc of documents) {
      for (const chunk of doc?.documentChunks || []) {
        if (chunk?.embedding) {
          // Parse embedding from JSON
          const chunkEmbedding = typeof chunk.embedding === 'string'
            ? JSON.parse(chunk.embedding)
            : chunk.embedding;
          
          const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding as number[]);
          
          if (similarity >= threshold) {
            results.push({
              content: chunk?.content || '',
              similarity,
              documentId: doc?.id || '',
            });
          }
        }
      }
    }

    // Sort by similarity and return top results
    return results
      .sort((a, b) => (b?.similarity ?? 0) - (a?.similarity ?? 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Error retrieving chunks:', error);
    return [];
  }
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // For PDF extraction, we'll use the LLM API directly
  // Convert buffer to base64 and send to LLM for extraction
  try {
    const base64 = buffer.toString('base64');
    const dataUri = `data:application/pdf;base64,${base64}`;
    
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'file',
                file: {
                  filename: 'document.pdf',
                  file_data: dataUri,
                },
              },
              {
                type: 'text',
                text: 'Extract all text content from this PDF document. Return only the extracted text without any additional commentary.',
              },
            ],
          },
        ],
        max_tokens: 8000,
      }),
    });

    if (!response?.ok) {
      throw new Error(`PDF extraction failed: ${response?.status}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return '';
  }
}

/**
 * Extract text from DOCX buffer
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result?.value || '';
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    return '';
  }
}

/**
 * Extract text from TXT buffer
 */
export function extractTextFromTXT(buffer: Buffer): string {
  try {
    return buffer.toString('utf-8');
  } catch (error) {
    console.error('Error extracting TXT text:', error);
    return '';
  }
}

/**
 * Detect file type and extract text accordingly
 */
export async function extractTextFromFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename?.toLowerCase()?.split('.')?.pop() || '';
  
  switch (ext) {
    case 'pdf':
      return await extractTextFromPDF(buffer);
    case 'docx':
      return await extractTextFromDOCX(buffer);
    case 'txt':
      return extractTextFromTXT(buffer);
    default:
      return '';
  }
}
