'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { useEffect, useState } from 'react';
import { Client } from '@clerk/nextjs/server';
import { useCall } from '@stream-io/video-react-sdk';

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
}: MeetingCardProps) => {
  const { toast } = useToast();
  const [totalParticipants, setTotalParticipants] = useState<number>(0);

  useEffect(() => {
    if (isPreviousMeeting && callId) {
      fetchCallParticipants(callId);
    }
  }, [isPreviousMeeting, callId]);

  const fetchCallParticipants = async (callId: string) => {
    try {
      const call = await useCall();

      if (call) {
        const participants = call.state.participants;
        setTotalParticipants(Object.keys(participants).length);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  return (
    <section className="flex min-h-[258px] w-full flex-col justify-between rounded-[14px] bg-dark-1 px-5 py-8 xl:max-w-[568px]">
      <article className="flex flex-col gap-5">
        <Image src={icon} alt="upcoming" width={28} height={28} />
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-base font-normal">{date}</p>
          </div>
        </div>
      </article>

      {isPreviousMeeting && totalParticipants > 0 && (
        <div className="mt-4 text-lg font-medium text-sky-1">
          Total Participants: {totalParticipants}
        </div>
      )}

      <article className={cn('flex justify-center relative', {})}>
        <div className="relative flex w-full max-sm:hidden"></div>
        {!isPreviousMeeting && (
          <div className="flex gap-2">
            <Button onClick={handleClick} className="rounded bg-blue-1 px-6">
              {buttonIcon1 && (
                <Image src={buttonIcon1} alt="feature" width={20} height={20} />
              )}
              &nbsp; {buttonText}
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast({
                  title: 'Link Copied',
                });
              }}
              className="bg-dark-4 px-6"
            >
              {/* <Image
                src="/icons/copy.svg"
                alt="feature"
                width={20}
                height={20}
              /> */}
              &nbsp; Copy Link
            </Button>
          </div>
        )}
      </article>
    </section>
  );
};

export default MeetingCard;
