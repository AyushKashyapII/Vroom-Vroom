'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

interface Message {
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
}

export default function SummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get and parse the data from URL
  const encodedData = searchParams.get('data');
  let transcriptionData;

  try {
    transcriptionData = encodedData
      ? JSON.parse(decodeURIComponent(encodedData))
      : null;
  } catch (error) {
    console.error('Error parsing data:', error);
    transcriptionData = null;
  }

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 Frontend: Question submission started');

    if (!question.trim()) {
      console.warn('⚠️ Frontend: Empty question submitted');
      return;
    }

    // Log the initial state
    console.log('📝 Frontend: Current state', {
      questionLength: question.length,
      currentMessagesCount: messages.length,
      transcriptionAvailable: !!transcriptionData?.transcription,
    });

    // Add question to messages
    const newQuestion: Message = {
      type: 'question',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newQuestion]);
    setIsLoading(true);
    console.log(
      '⏳ Frontend: Set loading state and added question to messages',
    );

    try {
      console.log('🔄 Frontend: Sending fetch request to /api/answer');
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          transcription: transcriptionData.transcription,
        }),
      });

      console.log('📥 Frontend: Received response', {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Frontend: Successfully parsed response data', {
        hasAnswer: !!data.answer,
        answerLength: data.answer?.length,
      });

      // Add answer to messages
      const newAnswer: Message = {
        type: 'answer',
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newAnswer]);
      console.log('📝 Frontend: Added answer to messages');
    } catch (error: any) {
      console.error('❌ Frontend: Error in question submission:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      // Add error message to chat
      const errorMessage: Message = {
        type: 'answer',
        content:
          'Sorry, there was an error processing your question. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      console.log('⚠️ Frontend: Added error message to chat');
    } finally {
      setIsLoading(false);
      setQuestion('');
      console.log('✅ Frontend: Reset loading state and question input');
    }
  };

  if (!transcriptionData) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-black-600">
          No transcription data found
        </h1>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-1 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Recording Summary</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          {transcriptionData.summary}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Full Transcription</h2>
        <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
          {transcriptionData.transcription}
        </div>
      </div>

      {/* Chat Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Questions & Answers</h2>

        {/* Messages Container */}
        <div className="bg-gray-50 rounded-lg p-4 h-[400px] overflow-y-auto mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.type === 'question' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block max-w-[80%] p-3 rounded-lg ${
                  message.type === 'question'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-black'
                }`}
              >
                <p>{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="text-left">
              <div className="inline-block bg-gray-200 p-3 rounded-lg">
                <p className="animate-pulse">Thinking...</p>
              </div>
            </div>
          )}
        </div>

        {/* Question Input Form */}
        <form onSubmit={handleQuestionSubmit} className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your queries related to this meeting?"
            className="p-3 w-full rounded-lg border border-gray-300 pr-24"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-2 px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {isLoading ? 'Sending...' : 'Ask'}
          </button>
        </form>
      </div>

      <button
        onClick={() => router.back()}
        className="mt-6 px-4 py-2 bg-blue-1 text-white rounded"
      >
        Back to Recordings
      </button>
    </div>
  );
}
