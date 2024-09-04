import React from "react";
import { FaEdit, FaBook, FaSave, FaBars } from "react-icons/fa";

const Header = ({
  ebookTitle,
  setEbookTitle,
  isEditingTitle,
  setIsEditingTitle,
  setIsEbookListOpen,
  currentChapter,
  chapters,
  isSaved,
  lastSavedTime,
  setIsSidebarOpen,
}) => (
  <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 shadow-lg z-30 relative">
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsEbookListOpen(true)}
            className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Open chapters"
          >
            <FaBook className="text-xl" />
          </button>
          <div className="flex items-center">
            {isEditingTitle ? (
              <input
                type="text"
                value={ebookTitle}
                onChange={(e) => setEbookTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyPress={(e) =>
                  e.key === "Enter" && setIsEditingTitle(false)
                }
                className="text-lg sm:text-xl font-bold bg-white bg-opacity-20 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-white"
                autoFocus
              />
            ) : (
              <h1 className="text-lg sm:text-xl font-bold truncate max-w-[150px] sm:max-w-xs">
                {ebookTitle}
              </h1>
            )}
            <button
              onClick={() => setIsEditingTitle(!isEditingTitle)}
              className="ml-2 text-white hover:text-gray-200 transition-colors duration-200"
              aria-label="Edit title"
            >
              <FaEdit />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="items-center space-x-2 sm:flex">
            <FaSave
              className={`${
                isSaved ? "text-green-300" : "text-yellow-300 animate-pulse"
              }`}
            />
            <span className="text-sm hidden sm:block">
              {isSaved ? "Saved" : "Saving..."}
            </span>
          </div>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Open chapters"
          >
            <FaBars className="text-xl" />
          </button>
        </div>
      </div>

      {currentChapter && (
        <p className="text-sm mt-2 text-center sm:text-left truncate">
          {chapters[currentChapter - 1].title}
        </p>
      )}
    </div>
  </header>
);

export default Header;
