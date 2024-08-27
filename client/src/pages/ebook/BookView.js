import React, { useState, useRef, useEffect } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaBook,
  FaPen,
  FaCopy,
  FaTrash,
  FaShareAlt,
  FaCheck,
} from "react-icons/fa";

import Chapter from "./Chapter";
import Sidebar from "./Sidebar";

function BookView() {
  const [currentChapter, setCurrentChapter] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedParagraphs, setSelectedParagraphs] = useState({});
  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
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
    content: `This is the first paragraph for Chapter ${
      i + 1
    }. It introduces the main topic of the chapter and delves into its significance, providing an insightful introduction that sets the stage for the discussion that follows. The complexities of the subject are outlined, with emphasis on how they interconnect with broader themes.\n\n
  
	This is the second paragraph. It goes into more detail about the subject matter, exploring various facets of the topic and presenting different perspectives. The paragraph provides in-depth analysis and critical insights, supported by relevant examples and case studies that illustrate the key points.\n\n
  
	This is the third paragraph. It provides examples and elaborates on key points, offering a comprehensive examination of the chapter's themes. The discussion is enriched with historical context and contemporary relevance, making connections to related concepts and ideas that enhance the reader's understanding.\n\n
  
	This is the fourth paragraph. It starts to wrap up the chapter's content by synthesizing the main arguments and reflecting on their implications. The paragraph highlights the most significant findings and suggests areas for further inquiry or consideration, encouraging readers to think critically about the material.\n\n
  
	This is the final paragraph. It summarizes the main takeaways from the chapter, reinforcing the key messages and leaving the reader with a clear understanding of the chapter's core insights. The conclusion ties the chapter back to the overarching themes of the book, providing a sense of closure and continuity as the reader progresses to the next chapter.`,
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

  const handleParagraphSelect = (chapterId, paragraphIndex) => {
    setSelectedParagraphs((prev) => {
      const newSelected = { ...prev };
      if (newSelected[chapterId] === paragraphIndex) {
        delete newSelected[chapterId];
      } else {
        newSelected[chapterId] = paragraphIndex;
      }
      return newSelected;
    });
    setIsRewriteOpen(false);
  };

  const handleRewrite = (chapterId, paragraphIndex, prompt) => {
    console.log("Rewrite paragraph in chapter:", chapterId);
    console.log("Paragraph index:", paragraphIndex);
    console.log("With prompt:", prompt);
    // Implement rewrite logic here
    closeMenu(chapterId);
  };

  const closeMenu = (chapterId) => {
    setSelectedParagraphs((prev) => {
      const newSelected = { ...prev };
      delete newSelected[chapterId];
      return newSelected;
    });
    setIsRewriteOpen(false);
  };

  const Footer = () => {
    return (
      <footer className="bg-gray-200 py-2 px-4 shadow-md z-30 relative">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          <button
            onClick={() => navigateChapter(Math.max(1, currentChapter - 1))}
            disabled={currentChapter === 1}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent"
            aria-label="Previous Chapter"
          >
            <FaChevronLeft size={20} />
          </button>
          <div className="flex items-center text-sm text-gray-600">
            <FaBook size={16} className="mr-2" />
            <span>
              {currentChapter}/{totalChapters}
            </span>
          </div>
          <button
            onClick={() =>
              navigateChapter(Math.min(totalChapters, currentChapter + 1))
            }
            disabled={currentChapter === totalChapters}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent"
            aria-label="Next Chapter"
          >
            <FaChevronRight size={20} />
          </button>
        </div>
      </footer>
    );
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
                onParagraphSelect={handleParagraphSelect}
                selectedParagraph={selectedParagraphs[chapter.id]}
                isRewriteOpen={isRewriteOpen}
                setIsRewriteOpen={setIsRewriteOpen}
                onRewrite={handleRewrite}
                onCloseMenu={closeMenu}
              />
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default BookView;
