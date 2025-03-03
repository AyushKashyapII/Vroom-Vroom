import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { Readable, Writable } from "stream";
import { Buffer } from "buffer";

// Set FFmpeg path for the WebAssembly version
ffmpeg.setFfmpegPath(ffmpegPath.path);

console.log("🚀 Initializing HuggingFace client...");
if (!process.env.HUGGINGFACE_API_KEY) {
  console.error('❌ API Route: HUGGINGFACE_API_KEY is not set in environment variables');
  throw new Error('HUGGINGFACE_API_KEY is not configured');
}
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY!);
console.log("✅ HuggingFace client initialized");

async function fetchWithTimeout(url: string, timeout: number) {
  console.log("⏳ Starting fetch with timeout:", url);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log("✅ Fetch completed successfully");
    
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("❌ Fetch failed:", error);
    throw error;
  }
}

// Fixed in-memory FFmpeg converter
async function convertVideoToAudio(videoBuffer: Buffer): Promise<Buffer> {
  console.log("🔄 Converting video to audio in memory...");
  
  return new Promise((resolve, reject) => {
    // Create readable stream from video buffer
    const videoStream = new Readable();
    videoStream._read = () => {}; // Required implementation
    videoStream.push(videoBuffer);
    videoStream.push(null);
    
    // Create a writable stream to collect audio data
    const audioChunks: Uint8Array[] = [];
    const outputStream = new Writable({
      write(chunk, encoding, callback) {
        audioChunks.push(chunk);
        callback();
      }
    });
    
    ffmpeg(videoStream)
      .inputFormat('mp4')
      .noVideo()
      .audioCodec('libmp3lame')
      .audioChannels(1)
      .audioFrequency(16000)
      .audioBitrate('64k')
      .format('mp3')
      .on("error", (err: Error) => {
        console.error("❌ Audio conversion failed:", err);
        reject(new Error(`Audio conversion failed: ${err.message}`));
      })
      .on("end", () => {
        console.log("✅ Audio conversion completed");
        resolve(Buffer.concat(audioChunks));
      })
      .pipe(outputStream);
  });
}

async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  console.log("🎯 Starting transcription with HuggingFace...");
  try {
    const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
    
    const transcription = await hf.automaticSpeechRecognition({
      data: blob,
      model: "openai/whisper-large-v3",
      parameters: {
        language: "en",
        return_timestamps: false,
        chunk_length_s: 30
      }
    });

    console.log("✅ Transcription completed");
    return transcription.text;
  } catch (error) {
    console.error("❌ Transcription error:", error);
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateSummary(text: string, maxRetries = 3): Promise<string> {
  console.log(`🤖 Starting summary generation (max retries: ${maxRetries})`);
  console.log(`📝 Text length to summarize: ${text.length} characters`);
  
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      console.log(`⏳ Summary attempt ${attempt + 1}/${maxRetries}`);
      const summary = await hf.summarization({
        model: "facebook/bart-large-cnn",
        inputs: text,
        parameters: {
          max_length: 130,
          min_length: 30,
          do_sample: false
        }
      });
      
      console.log("✅ Summary generated successfully", summary.summary_text);
      return summary.summary_text;
    } catch (error) {
      attempt++;
      console.error(`❌ Summary attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error("❌ All summary attempts exhausted");
        throw new Error(`Failed to generate summary after ${maxRetries} attempts: ${error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error("Failed to generate summary");
}

export const config = {
  runtime: 'edge', // This is important for Netlify Edge Functions
  maxDuration: 25000, // Set max duration to be under Netlify's limit (26s)
};

export async function POST(req: NextRequest) {
  console.log("\n🎬 Starting new transcription request...");

  try {
    const { videoUrl } = await req.json();
    console.log("📌 Video URL received:", videoUrl);

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format before attempting to fetch
    try {
      new URL(videoUrl);
    } catch (e) {
      console.error("❌ Invalid URL format:", videoUrl);
      return NextResponse.json(
        { error: "Invalid video URL format" },
        { status: 400 }
      );
    }

    // Download video
    const videoResponse = await fetchWithTimeout(videoUrl, 15000);
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    console.log(`📦 Downloaded video: ${videoBuffer.length} bytes`);

    // Check if we actually got video data
    if (videoBuffer.length === 0) {
      console.error("❌ Downloaded video is empty");
      throw new Error("Downloaded video is empty");
    }

    // Convert to audio in memory
    const audioBuffer = await convertVideoToAudio(videoBuffer);
    console.log(`🔊 Converted audio: ${audioBuffer.length} bytes`);

    // Check if we got audio data
    if (audioBuffer.length === 0) {
      console.error("❌ Generated audio is empty");
      throw new Error("Generated audio is empty");
    }

    // Transcribe
    const transcriptionText = await transcribeAudio(audioBuffer);
    
    // Clean the transcription text
    const cleanedText = transcriptionText
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log(`📄 Transcription complete: ${cleanedText.substring(0, 50)}...`);

    let summary = null;
    if (cleanedText.length > 0) {
      try {
        summary = await generateSummary(cleanedText);
      } catch (error) {
        console.error("❌ Summary generation failed:", error);
      }
    }

    console.log("✅ Process completed successfully");
    
    // Return with CORS headers for cross-domain access
    return new NextResponse(
      JSON.stringify({
        transcription: cleanedText,
        summary: summary || "Summary generation failed",
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );

  } catch (error) {
    console.error("❌ Process failed with error:", error);
    
    // Return error with CORS headers
    return new NextResponse(
      JSON.stringify({
        error: "Transcription failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  // Handle CORS preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}