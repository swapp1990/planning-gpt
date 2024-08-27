import React, { useState, useRef, useEffect } from "react";

const Chapter = React.forwardRef(({ chapter }, ref) => {
  return (
    <div ref={ref} className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-4 text-gray-800">{chapter.title}</h2>
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-700">Summary</h3>
        <div className="bg-gray-100 p-4 rounded-md h-24 overflow-y-auto relative">
          <p className="text-gray-600 pr-2">{chapter.summary}</p>
        </div>
      </div>
      <div className="prose max-w-none">
        <p>{chapter.content}</p>
      </div>
    </div>
  );
});

// Updated Sidebar component
const Sidebar = ({
  chapters,
  currentChapter,
  navigateChapter,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        ></div>
      )}
      <nav
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Chapters</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        <ul className="p-4 overflow-auto h-full">
          {chapters.map((chapter) => (
            <li key={chapter.id} className="mb-2">
              <button
                onClick={() => navigateChapter(chapter.id)}
                className={`w-full text-left p-2 rounded ${
                  currentChapter === chapter.id
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {chapter.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

function BookView() {
  const [currentChapter, setCurrentChapter] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const totalChapters = 10;
  const chapterRefs = useRef([]);

  // Sample chapters (unchanged)
  const chapters = Array.from({ length: totalChapters }, (_, i) => ({
    id: i + 1,
    title: `Chapter ${i + 1}`,
    summary: `This is a detailed summary of Chapter ${
      i + 1
    }. It provides an overview of the key points discussed in this chapter, including main ideas, important concepts, and notable events. The summary aims to give readers a quick understanding of the chapter's content before diving into the full text.`.repeat(
      2
    ),
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
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center z-30 relative">
        <div>
          <h1 className="text-xl font-bold">My Ebook Title</h1>
          <p className="text-sm">{chapters[currentChapter - 1].title}</p>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Chapters
        </button>
      </header>
      <div className="flex-grow overflow-hidden relative">
        <Sidebar
          chapters={chapters}
          currentChapter={currentChapter}
          navigateChapter={navigateChapter}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="h-full overflow-auto p-4">
          <div className="max-w-3xl mx-auto">
            {chapters.map((chapter, index) => (
              <Chapter
                key={chapter.id}
                ref={(el) => (chapterRefs.current[index] = el)}
                chapter={chapter}
              />
            ))}
          </div>
        </main>
      </div>
      <footer className="bg-gray-200 p-4 shadow-md z-30 relative">
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
