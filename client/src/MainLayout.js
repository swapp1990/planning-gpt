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
      <div className="flex flex-col min-h-screen overflow-hidden">
        <Header onToggleSidebar={handleToggleClick} />
        <div class="flex-grow flex flex-col mt-12 overflow-auto">
          {children}
        </div>
        <BottomNavigation />
      </div>
    </>
  );
}
