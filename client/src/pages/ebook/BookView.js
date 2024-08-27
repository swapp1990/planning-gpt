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

  const [currentChapter, setCurrentChapter] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedParagraphs, setSelectedParagraphs] = useState({});

  const totalChapters = 10;
  const chapterRefs = useRef([]);

  // Sample chapters (unchanged)
  const [chapters, setChapters] = useState(
    Array.from({ length: totalChapters }, (_, i) => ({
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
    }))
  );

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

  const handleRewrite = async (chapterId, paragraphIndex, prompt) => {
    console.log("Rewrite paragraph in chapter:", chapterId);
    console.log("Paragraph index:", paragraphIndex);
    console.log("With prompt:", prompt);

    let paragraph =
      chapters[chapterId - 1].content.split("\n\n")[paragraphIndex];
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

      setChapters((prevChapters) => {
        const newChapters = [...prevChapters];
        const chapterIndex = newChapters.findIndex(
          (chapter) => chapter.id === chapterId
        );
        if (chapterIndex !== -1) {
          const paragraphs = newChapters[chapterIndex].content.split("\n\n");
          paragraphs[paragraphIndex] = data.updatedParagraph;
          newChapters[chapterIndex].content = paragraphs.join("\n\n");
        }
        return newChapters;
      });
      closeMenu(chapterId);

      return { newParagraph: data.updatedParagraph };
    } catch (error) {
      console.error("Error fetching rewritten paragraph:", error);
      return { error: "ERror" };
    }
  };

  const closeMenu = (chapterId) => {
    setSelectedParagraphs((prev) => {
      const newSelected = { ...prev };
      delete newSelected[chapterId];
      return newSelected;
    });
  };

  const handleAddParagraph = async (chapterId, newParagraphPrompt) => {
    // Wrap setTimeout in a Promise and await it
    await new Promise((resolve) => {
      setTimeout(() => {
        setChapters((prevChapters) => {
          const newChapters = [...prevChapters];
          const chapterIndex = newChapters.findIndex(
            (chapter) => chapter.id === chapterId
          );
          if (chapterIndex !== -1) {
            const trimmedNewParagraph = newParagraphPrompt.trim();
            newChapters[chapterIndex].content =
              newChapters[chapterIndex].content.trim() +
              `\n\n${trimmedNewParagraph}`;
            // console.log(newChapters[chapterIndex].content);
          }
          return newChapters;
        });
        resolve(); // Resolve the promise after the timeout
      }, 2000);
    });

    // Return the result after the timeout
    return { newParagraph: newParagraphPrompt };
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
                onRewrite={handleRewrite}
                onContParagraph={handleContParagraph}
                onCloseMenu={closeMenu}
                onAddParagraph={handleAddParagraph}
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
