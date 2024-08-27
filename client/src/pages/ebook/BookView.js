import React, { useState, useRef, useEffect } from "react";

function BookView() {
  const [currentChapter, setCurrentChapter] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const totalChapters = 10;
  const chapterRefs = useRef([]);

  // Sample chapters with more content
  const chapters = Array.from({ length: totalChapters }, (_, i) => ({
    id: i + 1,
    title: `Chapter ${i + 1}`,
    content: `This is the content for Chapter ${i + 1}. `.repeat(20),
  }));

  useEffect(() => {
    if (chapterRefs.current[currentChapter - 1]) {
      chapterRefs.current[currentChapter - 1].scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [currentChapter]);

  const navigateChapter = (chapterNumber) => {
    setCurrentChapter(chapterNumber);
    setIsSidebarOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">My Ebook Title</h1>
          <p className="text-sm">{chapters[currentChapter - 1].title}</p>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          {isSidebarOpen ? "Close" : "Chapters"}
        </button>
      </header>
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar */}
        <nav
          className={`bg-gray-200 w-64 overflow-auto transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } absolute inset-y-0 left-0 z-30`}
        >
          <ul className="p-4">
            {chapters.map((chapter) => (
              <li key={chapter.id} className="mb-2">
                <button
                  onClick={() => navigateChapter(chapter.id)}
                  className={`w-full text-left p-2 rounded ${
                    currentChapter === chapter.id
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-300"
                  }`}
                >
                  {chapter.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {/* Main content */}
        <main className="flex-grow overflow-auto p-4">
          <div className="max-w-full mx-auto">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                ref={(el) => (chapterRefs.current[index] = el)}
                className="mb-8 p-6 bg-white rounded-lg shadow-md min-h-[50vh]"
              >
                <h2 className="text-2xl font-semibold mb-4">{chapter.title}</h2>
                <p>{chapter.content}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
      <footer className="bg-gray-200 p-4 shadow-md">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <button
            onClick={() => navigateChapter(Math.max(1, currentChapter - 1))}
            disabled={currentChapter === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          >
            Previous Chapter
          </button>
          <span>
            Chapter {currentChapter} of {totalChapters}
          </span>
          <button
            onClick={() =>
              navigateChapter(Math.min(totalChapters, currentChapter + 1))
            }
            disabled={currentChapter === totalChapters}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          >
            Next Chapter
          </button>
        </div>
      </footer>
    </div>
  );
}

export default BookView;
