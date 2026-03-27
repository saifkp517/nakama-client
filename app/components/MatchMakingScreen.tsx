'use client'

import React, { useState, useEffect } from 'react';

const MatchmakingScreen: React.FC = () => {
  const [seconds, setSeconds] = useState(26);

  useEffect(() => {
    // Simple countdown timer for visual effect
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  const handleCancel = () => {
    console.log("Matchmaking cancelled");
    // Navigation logic back to onboarding goes here
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f12] flex flex-col items-center justify-center p-4 font-sans text-center">
      {/* Main Status Text */}
      <h1 className="text-gray-100 text-2xl md:text-3xl font-medium tracking-wide mb-3">
        Finding a random player...
      </h1>

      {/* Dynamic Subtext */}
      <p className="text-gray-500 text-sm md:text-base mb-8">
        It usually takes {seconds} seconds.
      </p>

      {/* Cancel Button */}
      <button
        onClick={handleCancel}
        className="px-6 py-1.5 border border-gray-600 rounded-md text-gray-300 text-sm font-medium
                   hover:bg-gray-800 hover:border-gray-500 transition-all duration-200"
      >
        Cancel
      </button>

      {/* Optional: Subtle pulse loader to indicate activity */}
      <div className="mt-12 flex space-x-2">
        <div className="w-2 h-2 bg-[#00bfa5] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-[#00bfa5] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-[#00bfa5] rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

export default MatchmakingScreen;