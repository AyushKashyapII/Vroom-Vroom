'use client';
import MeetingTypeList from '@/components/MeetingTypeList';
import Image from 'next/image';
import { useState } from 'react';

const Home = () => {
  const now = new Date();

  const [showInfo, setShowInfo] = useState(false);

  const time = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  const date = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'full',
    timeZone: 'Asia/Kolkata',
  }).format(now);

  return (
    <section className="flex flex-col gap-5 text-white size-full overflow-y-hidden">
      <div className="w-full h-[303px] bg-cover rounded-[20px] bg-hero">
        <div className="flex flex-col justify-between h-full max-md:py-8 max-md:px-5 lg:p-11">
          <h2 className="py-2 text-base font-normal text-center rounded glassmorphism max-w-[273px]">
            Schedule your meetings ahead
          </h2>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold lg:text-7xl">{time}</h1>
            <p className="text-lg font-medium text-sky-500 lg:text-2xl">
              {date}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-row">
        <MeetingTypeList />
        <div className="relative flex items-center justify-center top-[-140px] left-[18px]">
          <Image
            src="/icons/programming.png"
            width={100}
            height={100}
            alt="Programming Icon"
            onClick={() => setShowInfo(true)}
          />
        </div>
      </div>
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          {/* Modal Content Box */}
          <div className="relative w-[400px] max-w-full p-6 bg-white rounded-lg shadow-lg">
            {/* Close Button */}
            <button
              className="absolute top-2 right-3 text-2xl font-bold text-black"
              onClick={() => setShowInfo(false)}
            >
              &times;
            </button>

            {/* Content Area */}
            <div className="text-lg font-semibold text-center text-black">
              <h2 className="mb-3 text-2xl font-bold">
                My Full-Stack Zoom Clone 🚀
              </h2>
              <p className="text-gray-700">
                I built this <strong>full-stack Zoom clone</strong> using{' '}
                <strong>Next.js</strong> for the frontend,{' '}
                <strong>Clerk</strong> for authentication, and{' '}
                <strong>GetStream</strong> for real-time streaming.
                <br />
                This project was one of the most challenging I&apos;ve ever
                worked on, but the feeling of finally completing it is
                absolutely amazing!
              </p>
              <div className="flex items-center justify-center w-full">
                <Image
                  src="/images/leo.png"
                  width={400}
                  height={400}
                  alt="Image"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Home;
