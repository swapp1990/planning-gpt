import React, { useState, useEffect } from "react";
import { FaBook, FaEdit, FaSave, FaBars } from "react-icons/fa";

import { useEbook } from "../../context/EbookContext";

const BookHeader = ({ setIsEbookListOpen }) => {
  const { ebookState, uiActions } = useEbook();
  const [showSaveStatus, setShowSaveStatus] = useState(false);

  useEffect(() => {
    // console.log(ebookState);
  }, [ebookState]);

  useEffect(() => {
    let timeoutId;
    if (ebookState.isSaved) {
      setShowSaveStatus(true);
      timeoutId = setTimeout(() => {
        setShowSaveStatus(false);
      }, 1000);
    } else {
      setShowSaveStatus(true);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [ebookState.isSaved]);

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 shadow-lg z-30 relative">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-start items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsEbookListOpen(true)}
              className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Open chapters"
            >
              <FaBook className="text-xl" />
            </button>
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold truncate max-w-[150px] sm:max-w-xs">
                {ebookState.ebookTitle}
              </h1>
              {/* <button
                onClick={() => setIsEditingTitle(!isEditingTitle)}
                className="ml-2 text-white hover:text-gray-200 transition-colors duration-200"
                aria-label="Edit title"
              >
                <FaEdit />
              </button> */}
            </div>
          </div>

          {showSaveStatus && (
            <div className="items-center space-x-2 sm:flex ml-4">
              <FaSave
                className={`${
                  ebookState.isSaved
                    ? "text-green-300"
                    : "text-yellow-300 animate-pulse"
                }`}
              />
              <span className="text-sm hidden sm:block">
                {ebookState.isSaved ? "Saved" : "Saving..."}
              </span>
            </div>
          )}
        </div>

        {ebookState.currentChapter && (
          <p className="text-sm mt-2 text-center sm:text-left truncate">
            {/* {ebookState.chapters[currentChapter - 1].title} */}
          </p>
        )}
      </div>
    </header>
  );
};

export default BookHeader;
