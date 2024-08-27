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

const Paragraph = ({ content, onSelect, isSelected }) => {
  return (
    <p
      className={`p-2 rounded transition-colors duration-200 hover:bg-gray-100 cursor-pointer ${
        isSelected ? "bg-blue-100" : ""
      }`}
      onClick={() => onSelect(content)}
    >
      {content}
    </p>
  );
};

const ParagraphMenu = ({ top, left, onClose, onRewrite }) => {
  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const [rewritePrompt, setRewritePrompt] = useState("");
  const handleRewriteClick = () => {
    setIsRewriteOpen(true);
  };

  const handleSubmitRewrite = () => {
    onRewrite(rewritePrompt);
    setIsRewriteOpen(false);
    setRewritePrompt("");
  };

  const handleCancelRewrite = () => {
    setIsRewriteOpen(false);
    setRewritePrompt("");
  };
  return (
    <div
      className="absolute bg-white rounded-lg shadow-lg p-2 z-50 flex flex-col"
      style={{ top: `${top}px`, left: `${left}px` }}
    >
      <div className="p-2 flex space-x-2">
        <button
          onClick={handleRewriteClick}
          className={`p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 ${
            isRewriteOpen ? "bg-blue-100" : ""
          }`}
          title="Rewrite"
        >
          <FaPen className="text-blue-500" />
        </button>
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          title="Copy"
        >
          <FaCopy className="text-green-500" />
        </button>
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          title="Delete"
        >
          <FaTrash className="text-red-500" />
        </button>
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          title="Share"
        >
          <FaShareAlt className="text-purple-500" />
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          title="Close"
        >
          &times;
        </button>
      </div>
      {isRewriteOpen && (
        <div className="p-2 border-t">
          <textarea
            className="w-full p-2 border rounded-md"
            rows="3"
            placeholder="Enter your rewrite prompt..."
            value={rewritePrompt}
            onChange={(e) => setRewritePrompt(e.target.value)}
          />
          <div className="flex justify-end mt-2 space-x-2">
            <button
              onClick={handleCancelRewrite}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRewrite}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
            >
              <FaCheck size={16} className="mr-1" />
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Chapter = React.forwardRef(
  ({ chapter, onParagraphSelect, selectedParagraph }, ref) => {
    const paragraphs = chapter.content.split(". ").map((p) => p.trim() + ".");

    return (
      <div ref={ref} className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          {chapter.title}
        </h2>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Summary</h3>
          <div className="bg-gray-100 p-4 rounded-md h-24 overflow-y-auto relative">
            <p className="text-gray-600 pr-2">{chapter.summary}</p>
          </div>
        </div>
        <div className="prose max-w-none">
          {paragraphs.map((paragraph, index) => (
            <Paragraph
              key={index}
              content={paragraph}
              onSelect={onParagraphSelect}
              isSelected={selectedParagraph === paragraph}
            />
          ))}
        </div>
      </div>
    );
  }
);

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
  const [selectedParagraph, setSelectedParagraph] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
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

  const handleParagraphSelect = (content) => {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedParagraph(content);
    setMenuPosition({
      top: rect.top - 80,
      left: rect.left,
    });
  };

  const handleRewrite = () => {
    console.log("Rewrite paragraph:", selectedParagraph);
    // Implement rewrite logic here
    closeMenu();
  };

  const closeMenu = () => {
    setSelectedParagraph(null);
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
                selectedParagraph={selectedParagraph}
              />
            ))}
          </div>
        </main>
        {selectedParagraph && (
          <ParagraphMenu
            top={menuPosition.top}
            left={menuPosition.left}
            onClose={closeMenu}
            onRewrite={handleRewrite}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default BookView;
