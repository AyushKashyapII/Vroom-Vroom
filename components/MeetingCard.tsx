'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface MeetingCardProps {
  title: string;
  date: string;
  icon: string;
  callId: string;
  isPreviousMeeting?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
  buttonText2?: string;
  handleClick2?: () => void;
  isRecordingAvailable?: boolean;
  additionalButton?: () => void;
  handleSummarize?: () => void;
}

const MeetingCard = ({
  icon,
  title,
  date,
  callId,
  isPreviousMeeting,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
  buttonText2,
  handleClick2,
  isRecordingAvailable,
  additionalButton,
  handleSummarize,
}: MeetingCardProps) => {
  const { toast } = useToast();

  return (
    <section className="flex w-full min-h-[258px] flex-col justify-between rounded-xl bg-dark-1 px-5 py-8 xl:max-w-[568px]">
      <article className="flex flex-col gap-5">
        <Image src={icon} alt="upcoming" width={28} height={28} />
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-base font-normal">{date}</p>
          </div>
        </div>
      </article>

      <article className={cn('relative flex justify-center', {})}>
        <div className="relative hidden w-full max-sm:block"></div>

        {!isPreviousMeeting && (
          <div className="flex gap-2">
            <Button
              onClick={handleClick}
              className="rounded bg-blue-1 px-6 sm:w-[25%]"
            >
              {buttonIcon1 && (
                <Image src={buttonIcon1} alt="feature" width={20} height={20} />
              )}
              &nbsp; {buttonText}
            </Button>
            <Button
              onClick={handleSummarize}
              className="rounded bg-blue-1 px-6 sm:w-[25%]"
            >
              Summarize
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast({
                  title: 'Link Copied',
                });
              }}
              className="bg-dark-4 px-6 sm:w-[25%]"
            >
              &nbsp; Copy Link
            </Button>
          </div>
        )}

        {isPreviousMeeting && isRecordingAvailable && (
          <button
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            onClick={() => console.log('Recording exists')}
          >
            Recording Exists
          </button>
        )}
      </article>
    </section>
  );
};

export default MeetingCard;
