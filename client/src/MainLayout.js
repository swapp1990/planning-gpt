import React, { useState, useEffect, useRef } from "react";
import BottomNavigation from "./components/BottomNavigation";
import useViewportHeight from "./utils/useViewportHeight";
import AnimatedLogo from "./components/ebook/AnimatedLogo";

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowHeight, setWindowHeight] = useState("100vh");

  const viewportHeight = useViewportHeight();

  const handleToggleClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <div className="flex flex-col" style={{ height: `${viewportHeight}px` }}>
        {/* <Header onToggleSidebar={handleToggleClick} /> */}
        <span className="inline-flex items-center text-sm font-semibold text-gray-800 bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 rounded-full shadow-sm">
          Let me
          <span className="mx-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-in-out">
            WRITE
          </span>
          for you
        </span>
        <div class="flex-grow overflow-auto">{children}</div>
        {/*  */}
        <footer className="bg-gray-200 shadow-md flex-shrink-0">
          <BottomNavigation />
        </footer>
      </div>
    </>
  );
}
