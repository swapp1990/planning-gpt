import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import BottomNavigation from "./components/BottomNavigation";
export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowHeight, setWindowHeight] = useState("100vh");

  const handleToggleClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const updateHeight = () => {
      setWindowHeight(`${window.innerHeight}px`);
    };

    window.addEventListener("resize", updateHeight);
    updateHeight(); // Set initial height

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <>
      <div className="flex flex-col" style={{ height: windowHeight }}>
        {/* <Header onToggleSidebar={handleToggleClick} /> */}
        <header className="bg-blue-600 text-white p-4 shadow-md h-16 flex-shrink-0">
          Test Header
        </header>
        <div class="flex-grow overflow-auto">{children}</div>
        {/* <BottomNavigation /> */}
        <footer className="bg-gray-200 p-4 shadow-md h-16 flex-shrink-0">
          Test Footer
        </footer>
      </div>
    </>
  );
}
