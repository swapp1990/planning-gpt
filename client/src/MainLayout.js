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
        <AnimatedLogo />
        <div class="flex-grow overflow-auto">{children}</div>
        {/*  */}
        <footer className="bg-gray-200 shadow-md flex-shrink-0">
          <BottomNavigation />
        </footer>
      </div>
    </>
  );
}
