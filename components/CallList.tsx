'use client';

import { Call, CallRecording } from '@stream-io/video-react-sdk';
import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// interface TranscriptionResponse {
//   transcription: string;
//   summary: string;
// }

const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls();
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordings, setRecordings] = useState<CallRecording[]>([]);

  useEffect(() => {
    const fetchRecordings = async () => {
      const callData = await Promise.all(
        callRecordings?.map((meeting) => meeting.queryRecordings()) ?? [],
      );
      const recordings = callData
        .filter((call) => call.recordings.length > 0)
        .flatMap((call) => call.recordings);
      setRecordings(recordings);
    };

    if (type === 'recordings') {
      fetchRecordings();
    }
  }, [type, callRecordings]);

  if (isLoading) return <Loader />;

  const calls =
    type === 'ended'
      ? endedCalls
      : type === 'upcoming'
        ? upcomingCalls
        : recordings;
  const noCallsMessage =
    type === 'ended'
      ? 'No Previous Calls'
      : type === 'upcoming'
        ? 'No Upcoming Calls'
        : 'No Recordings';

  const summarizeRecording = async (videoUrl: string) => {
    setIsProcessing(true);
    try {
      const response = await axios.post(`/api/transcribe`, { videoUrl });
      if (response.status !== 200) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      const encodedData = encodeURIComponent(
        JSON.stringify({
          transcription: response.data.transcription,
          summary: response.data.summary,
        }),
      );
      router.push(`/recordings/summary?data=${encodedData}`);
    } catch (error) {
      console.error('Error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <>
        <h2 className="text-black font-bold">Processing the Video...</h2>
        <Loader />
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {calls && calls.length > 0 ? (
        calls.map((meeting: Call | CallRecording) => {
          const isRecordingAvailable = recordings.some(
            (recording) =>
              (recording as any).meeting_id === (meeting as Call).id,
          );

          return (
            <MeetingCard
              key={(meeting as Call).id}
              callId={(meeting as Call).id}
              icon={
                type === 'ended'
                  ? '/icons/previous.svg'
                  : type === 'upcoming'
                    ? '/icons/upcoming.svg'
                    : '/icons/recordings.svg'
              }
              title={
                (meeting as Call).state?.custom?.description ||
                (meeting as CallRecording).filename?.substring(0, 20) ||
                'No Description'
              }
              date={
                (meeting as Call).state?.startsAt?.toLocaleString() ||
                (meeting as CallRecording).start_time?.toLocaleString()
              }
              isPreviousMeeting={type === 'ended'}
              isRecordingAvailable={isRecordingAvailable}
              link={
                type === 'recordings'
                  ? (meeting as CallRecording).url
                  : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${(meeting as Call).id}`
              }
              buttonIcon1={
                type === 'recordings' ? '/icons/play.svg' : undefined
              }
              buttonText={type === 'recordings' ? 'Play' : 'Start'}
              handleClick={
                type === 'recordings'
                  ? () => router.push(`${(meeting as CallRecording).url}`)
                  : () => router.push(`/meeting/${(meeting as Call).id}`)
              }
              buttonText2={
                type === 'ended' && isRecordingAvailable
                  ? 'Summarize the meeting'
                  : undefined
              }
              handleClick2={
                type === 'ended' && isRecordingAvailable
                  ? () => router.push(`/summarize/${(meeting as Call).id}`)
                  : undefined
              }
              additionalButton={
                type === 'ended' && isRecordingAvailable
                  ? () => console.log('Recording exists')
                  : undefined
              }
              handleSummarize={() =>
                summarizeRecording(`${(meeting as CallRecording).url}`)
              }
            />
          );
        })
      ) : (
        <h1 className="text-2xl font-bold text-black">{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;
