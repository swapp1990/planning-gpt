import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import BottomNavigation from "./components/BottomNavigation";
export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleToggleClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <div className="h-screen flex flex-col">
        {/* <Header onToggleSidebar={handleToggleClick} /> */}
        <header className="bg-blue-600 text-white p-4 shadow-md h-16">
          Test Header
        </header>
        <div class="flex-grow overflow-hidden">{children}</div>
        {/* <BottomNavigation /> */}
        <footer className="bg-gray-200 p-4 shadow-md h-16">Test Footer</footer>
      </div>
    </>
  );
}
