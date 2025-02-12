// app/api/answer/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

interface RequestBody {
  question: string;
  transcription: string;
}

export async function POST(request: Request) {
  console.log('🔵 API Route: Received new request');
  
  try {
    // Parse the request body
    const body: RequestBody = await request.json();
    console.log('📥 API Route: Received request body:', {
      questionLength: body.question?.length,
      transcriptionLength: body.transcription?.length,
    });

    const { question, transcription } = body;

    // Validate the input
    if (!question || !transcription) {
      console.warn('⚠️ API Route: Missing required fields', {
        hasQuestion: !!question,
        hasTranscription: !!transcription,
      });
      return NextResponse.json(
        { error: 'Question and transcription are required' },
        { status: 400 }
      );
    }

    console.log('✅ API Route: Input validation passed');

    // Initialize Groq client
    console.log('🔄 API Route: Initializing Groq client');
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    if (!process.env.GROQ_API_KEY) {
      console.error('❌ API Route: GROQ_API_KEY is not set in environment variables');
      throw new Error('GROQ_API_KEY is not configured');
    }

    // Create the prompt
    const prompt = `
      Context: ${transcription}
      
      Question: ${question}
      
      Please provide a clear and concise answer to the question based on the context provided above.
      If the answer cannot be found in the context, please respond with "I cannot find an answer to this question in the provided context."
    `;

    console.log('🤖 API Route: Sending request to Groq API', {
      promptLength: prompt.length,
      questionAsked: question,
    });

    // Get completion from Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that answers questions based on provided context.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.5,
      max_tokens: 1000,
    });

    console.log('✅ API Route: Received response from Groq API');

    // Extract the answer from the completion
    const answer = completion.choices[0]?.message?.content || 'Sorry, I could not generate an answer.';
    console.log('📤 API Route: Sending response', {
      answerLength: answer.length,
      firstFewWords: answer.slice(0, 50) + '...',
    });

    // Return the response
    return NextResponse.json({ answer });
  } catch (error:any) {
    console.error('❌ API Route: Error processing question:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Failed to process your question' },
      { status: 500 }
    );
  }
}