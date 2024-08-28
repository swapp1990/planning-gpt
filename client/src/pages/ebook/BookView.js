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
  const [chatType, setChatType] = useState("writing_assistant");
  const [systemPrompts, setSystemPrompts] = useState([]);
  const [parameters, setParameters] = useState([]);

  const [currentChapter, setCurrentChapter] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedParagraphs, setSelectedParagraphs] = useState({});

  const totalChapters = 0;
  const chapterRefs = useRef([]);

  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    console.log("init BookView");
    init();
  }, []);

  useEffect(() => {
    if (chapterRefs.current[currentChapter - 1]) {
      chapterRefs.current[currentChapter - 1].scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [currentChapter]);

  const init = async () => {
    await loadSystemPrompts(chatType);
  };

  const loadSystemPrompts = async (chatType) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/prompt/system?type=${chatType}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setSystemPrompts(data.prompts);
      console.log(data.prompts);
      let parameters = [];
      parameters.push({
        title: "System Prompts",
        points: data.prompts,
      });
      parameters = [...parameters, ...data.parameters];
      setParameters(parameters);
    } catch (error) {
      console.error("Error fetching system prompt:", error);
    }
  };

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
  };

  const handleContParagraph = async (chapterId, paragraphIndex, prompt) => {
    console.log("Add paragraph in chapter:", chapterId);
    console.log("Paragraph index:", paragraphIndex);
    console.log("With prompt:", prompt);

    await new Promise((resolve) => {
      setTimeout(() => {
        const data = { paragraph: prompt };
        setChapters((prevChapters) => {
          const newChapters = [...prevChapters];
          const chapterIndex = newChapters.findIndex(
            (chapter) => chapter.id === chapterId
          );
          if (chapterIndex !== -1) {
            const paragraphs = newChapters[chapterIndex].content.split("\n\n");
            paragraphs.splice(paragraphIndex + 1, 0, data.paragraph);
            newChapters[chapterIndex].content = paragraphs.join("\n\n");
            return newChapters;
          }
        });
        closeMenu(chapterId);
        resolve();
      }, 2000);
    });

    return { newParagraph: prompt };
  };

  const updateChapterContent = (chapterId, paragraphId, content) => {
    setChapters((prevChapters) => {
      const newChapters = [...prevChapters];
      const chapterIndex = newChapters.findIndex(
        (chapter) => chapter.id === chapterId
      );
      if (chapterIndex !== -1) {
        const paragraphs = newChapters[chapterIndex].content.split("\n\n");
        paragraphs[paragraphId] = content;
        newChapters[chapterIndex].content = paragraphs.join("\n\n");
      }
      return newChapters;
    });
  };

  const handleRewrite = async (chapterId, paragraphId, prompt) => {
    console.log("Rewrite paragraph in chapter:", chapterId);
    console.log("Paragraph index:", paragraphId);
    console.log("With prompt:", prompt);

    let paragraph = chapters[chapterId - 1].content.split("\n\n")[paragraphId];
    console.log(paragraph);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/paragraph`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paragraph,
            systemPrompt: systemPrompts[0] + "\n" + systemPrompts[1],
            instruction: prompt,
          }),
        }
      );

      const data = await response.json();
      console.log(data);
      if (data.updatedParagraph === undefined) {
        return { error: "ERror" };
      }
      updateChapterContent(chapterId, paragraphId, data.updatedParagraph);
      closeMenu(chapterId);
      return { newParagraph: data.updatedParagraph };
    } catch (error) {
      console.error("Error fetching rewritten paragraph:", error);
      return { error: "ERror" };
    }
  };

  const handleContinueChapter = async (chapterId, instruction) => {
    console.log("Continue chapter:", chapterId);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/chapter/continue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: chapters[chapterId - 1].summary,
            passage: chapters[chapterId - 1].content,
            systemPrompt: systemPrompts[0],
            instruction: instruction,
          }),
        }
      );
      const data = await response.json();
      console.log(data);
      let paragraphs = chapters[chapterId - 1].content.split("\n\n");
      let paraIndex = paragraphs.length == 0 ? 0 : paragraphs.length + 1;
      updateChapterContent(chapterId, paraIndex, data.paragraph);
      return { newParagraph: data.paragraph };
    } catch (error) {
      console.error("Error fetching continue chapter response:", error);
      return { error: "Error" };
    }
  };

  const closeMenu = (chapterId) => {
    setSelectedParagraphs((prev) => {
      const newSelected = { ...prev };
      delete newSelected[chapterId];
      return newSelected;
    });
  };

  const handleSummaryUpdate = (chapterId, newSummary) => {
    setChapters((prevChapters) => {
      return prevChapters.map((chapter) => {
        if (chapter.id === chapterId) {
          return { ...chapter, summary: newSummary };
        }
        return chapter;
      });
    });
    return { newSummary: newSummary };
  };

  const addNewChapter = () => {
    setChapters((prevChapters) => [
      ...prevChapters,
      {
        id: prevChapters.length + 1,
        title: `Chapter ${prevChapters.length + 1}`,
        content: "",
        summary: "Summary of the chapter",
      },
    ]);
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
              {currentChapter}/{chapters.length}
            </span>
          </div>
          <button
            onClick={() =>
              navigateChapter(Math.min(chapters.length, currentChapter + 1))
            }
            disabled={currentChapter === chapters.length}
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
          {currentChapter && (
            <p className="text-sm">{chapters[currentChapter - 1].title}</p>
          )}
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
            <div className="text-center text-gray-500">
              {chapters.length == 0 && (
                <div>
                  <p className="text-2xl">
                    <FaBook size={32} className="inline-block mb-2" />
                  </p>
                  <p className="text-lg">No chapters available</p>
                </div>
              )}
              <button
                onClick={() => addNewChapter()}
                className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition-colors text-white mb-4"
              >
                Add New Chapter
              </button>
            </div>
            {chapters.map((chapter, index) => (
              <Chapter
                key={chapter.id}
                ref={(el) => (chapterRefs.current[index] = el)}
                chapter={chapter}
                onParagraphSelect={handleParagraphSelect}
                selectedParagraph={selectedParagraphs[chapter.id]}
                onRewrite={handleRewrite}
                onContParagraph={handleContParagraph}
                onCloseMenu={closeMenu}
                onContinueChapter={handleContinueChapter}
                onSummaryUpdate={handleSummaryUpdate}
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
