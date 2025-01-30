'use client';
import MeetingTypeList from '@/components/MeetingTypeList';

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
    <section className="flex size-full flex-col gap-5 text-white overflow-y-hidden scrollbar-hide">
      <div className="h-[303px] w-full rounded-[20px] bg-hero bg-cover">
        <div className="flex h-full flex-col justify-between max-md:px-5 max-md:py-8 lg:p-11">
          <h2 className="glassmorphism max-w-[273px] rounded py-2 text-center text-base font-normal">
            Upcoming Meeting at: 12:30 PM
          </h2>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold lg:text-7xl">{time}</h1>
            <p className="text-lg font-medium text-sky-1 lg:text-2xl">{date}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-row ">
        <MeetingTypeList />
        <div className="flex justify-center items-center relative -top-[140px] left-[18px]">
          <img
            src="/icons/programming.png"
            width={100}
            onClick={() => {
              setShowInfo(true);
            }}
          ></img>
        </div>
      </div>
      {showInfo && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          {/* Modal Content Box */}
          <div className="relative w-[400px] max-w-full bg-white rounded-lg p-6 shadow-lg">
            {/* Close Button */}
            <button
              className="absolute top-2 right-3 text-black text-2xl font-bold"
              onClick={() => setShowInfo(false)}
            >
              &times;
            </button>

            {/* Content Area */}
            <div className="text-black text-lg font-semibold text-center">
              <h2 className="text-2xl font-bold mb-3">
                My Full-Stack Zoom Clone 🚀
              </h2>
              <p className="text-gray-700">
                I built this <strong>full-stack Zoom clone</strong> using{' '}
                <strong>Next.js</strong> for the frontend,{' '}
                <strong>Clerk</strong> for authentication, and{' '}
                <strong>GetStream</strong> for real-time streaming.
                <br />
                This project was one of the most challenging I've ever worked
                on, but the feeling of finally completing it is absolutely
                amazing!
              </p>
              <div className="flex justify-center items-center w-full br-3">
                <img src="/images/leo.png" width={400}></img>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Home;
