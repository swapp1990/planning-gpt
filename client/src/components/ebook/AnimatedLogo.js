import React, { useState, useEffect } from "react";

const AnimatedLogo = () => {
  const [currentVerb, setCurrentVerb] = useState("write");
  const verbs = ["write"];

  //   useEffect(() => {
  //     const interval = setInterval(() => {
  //       setCurrentVerb((prev) => {
  //         const currentIndex = verbs.indexOf(prev);
  //         return verbs[(currentIndex + 1) % verbs.length];
  //       });
  //     }, 3000);

  //     return () => clearInterval(interval);
  //   }, []);

  return (
    <div className="w-80 h-40 relative">
      <svg viewBox="0 0 200 20" className="w-full h-full">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="verbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FF4500" />
          </linearGradient>
        </defs>

        {/* Rounded rectangle background */}
        <rect
          x="0"
          y="0"
          width="180"
          height="20"
          rx="5"
          ry="5"
          fill="url(#gradient)"
        />

        {/* Main text elements */}
        <text x="20" y="15" className="text-white text-md font-bold">
          Let me
        </text>

        {/* Verb background and text */}
        <rect
          x="75"
          y="5"
          width="50"
          height="15"
          rx="15"
          ry="15"
          fill="url(#verbGradient)"
          className="animate-fade-in-out"
        />
        <text
          x="100"
          y="17"
          textAnchor="middle"
          className="text-white text-md font-bold"
        >
          {currentVerb}
        </text>

        {/* "for you" text */}
        <text
          x="150"
          y="15"
          textAnchor="middle"
          className="text-white text-sm italic"
        >
          for you
        </text>
      </svg>
    </div>
  );
};

export default AnimatedLogo;
