import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import fs from "fs";

// export const config = {
//   api: {
//     bodyParser: {
//       sizeLimit: '50mb'
//     },
//     responseLimit: false
//   }
// };

let ffmpeg: any;
if (process.env.NODE_ENV === 'production') {
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
  ffmpeg = require('fluent-ffmpeg');
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
  ffmpeg = require('fluent-ffmpeg');
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);

console.log("🚀 Initializing HuggingFace client...");
if (!process.env.HUGGINGFACE_API_KEY) {
  console.error('❌ API Route: HUGGINGFACE_API_KEY is not set in environment variables');
  throw new Error('HUGGINGFACE_API_KEY is not configured');
}
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY!);
console.log("✅ HuggingFace client initialized");

async function fetchWithTimeout(url: string, timeout: number) {
  console.log("⏳ Starting fetch with timeout:", timeout);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log("✅ Fetch completed successfully");
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("❌ Fetch failed:", error);
    throw error;
  }
}

async function cleanupFiles(...files: string[]) {
  console.log("🧹 Starting cleanup of files:", files);
  for (const file of files) {
    try {
      if (fs.existsSync(file)) {
        await unlink(file);
        console.log(`✅ Cleaned up file: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error cleaning up file ${file}:`, error);
    }
  }
}

async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  console.log("🎯 Starting transcription with HuggingFace...");
  try {
    
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
    formData.append('audio', audioBlob, 'audio.mp3');

    
    const response = await fetch(
      `https://api-inference.huggingface.co/models/openai/whisper-large-v3`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        },
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ Transcription completed", result);
    return result.text;

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
      
      console.log("✅ Summary generated successfully");
      return summary.summary_text;
    } catch (error) {
      attempt++;
      console.error(`❌ Summary attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error("❌ All summary attempts exhausted");
        throw new Error(`Failed to generate summary after ${maxRetries} attempts`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error("Failed to generate summary");
}

export async function POST(req: NextRequest) {
  console.log("\n🎬 Starting new transcription request...");
  const videoPath = path.join(tmpdir(), `temp-${Date.now()}.mp4`);
  const audioPath = path.join(tmpdir(), `temp-${Date.now()}.mp3`);

  try {
    const { videoUrl } = await req.json();
    console.log("📌 Video URL received:");

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 }
      );
    }

    // Download video
    const videoResponse = await fetchWithTimeout(videoUrl, 30000);
    if (!videoResponse.ok) {
      throw new Error(
        `Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`
      );
    }

    // Save video file
    const buffer = await videoResponse.arrayBuffer();
    await writeFile(videoPath, new Uint8Array(buffer));
    console.log("✅ Video file saved");

    // Convert to audio with optimal settings for Whisper
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat("mp3")
        .audioChannels(1)          
        .audioFrequency(16000)     
        .audioBitrate('64k')       
        .on("error", (err: Error) => {
          console.error("❌ FFmpeg error:", err);
          reject(new Error(`Audio conversion failed: ${err.message}`));
        })
        .on("end", () => {
          console.log("✅ Audio conversion completed");
          resolve(true);
        })
        .save(audioPath);
    });

    // Read and verify audio file
    const audioData = await readFile(audioPath);
    if (audioData.length === 0) {
      throw new Error("Generated audio file is empty");
    }
    console.log(`✅ Audio file read: ${audioData.length} bytes`);

    // Transcribe
    const transcriptionText = await transcribeAudio(audioData);
    
    // Clean the transcription text
    const cleanedText = transcriptionText
      .replace(/\s+/g, ' ')
      .trim();
    console.log("✅ Transcription cleaned");

    let summary = null;
    if (cleanedText.length > 0) {
      try {
        summary = await generateSummary(cleanedText);
      } catch (error) {
        console.error("❌ Summary generation failed:", error);
      }
    }

    return NextResponse.json({
      transcription: cleanedText,
      summary: summary || "Summary generation failed",
    });

  } catch (error) {
    console.error("❌ Process failed with error:", error);
    return NextResponse.json(
      { 
        error: "Transcription failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );

  } finally {
    await cleanupFiles(videoPath, audioPath);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
