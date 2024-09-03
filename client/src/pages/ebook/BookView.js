import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight, FaBook, FaEdit } from "react-icons/fa";

import { streamedApiCall } from "../../utils/api";

import Chapter from "./Chapter";
import Sidebar from "./Sidebar";

import { BookProvider } from "./BookContext";

function BookView() {
  const [chatType, setChatType] = useState("writing_assistant");
  const [systemPrompts, setSystemPrompts] = useState([]);
  const [parameters, setParameters] = useState([]);

  const [currentChapter, setCurrentChapter] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedParagraphs, setSelectedParagraphs] = useState({});

  const [ebookTitle, setEbookTitle] = useState("My Ebook Title");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [ebooks, setEbooks] = useState([]);
  const [isEbookListOpen, setIsEbookListOpen] = useState(false);

  const totalChapters = 0;
  const chapterRefs = useRef([]);

  const [chapters, setChapters] = useState([]);
  const [isSaved, setIsSaved] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  const saveToLocalStorage = useCallback(() => {
    const bookData = {
      title: ebookTitle,
      chapters,
      currentChapter,
      systemPrompts,
      parameters,
    };

    // Save current ebook
    localStorage.setItem("currentEbook", JSON.stringify(bookData));

    // Update ebooks list
    const updatedEbooks = ebooks.filter((ebook) => ebook.title !== ebookTitle);
    if (ebookTitle !== "New Ebook") {
      updatedEbooks.push({
        title: ebookTitle,
        lastModified: new Date().toISOString(),
        bookData: bookData,
      });
      localStorage.setItem("ebooks", JSON.stringify(updatedEbooks));
      setEbooks(updatedEbooks);
    }

    setIsSaved(true);
    setLastSavedTime(new Date().toLocaleTimeString());
  }, [chapters, currentChapter, systemPrompts, parameters, ebookTitle, ebooks]);

  const loadFromLocalStorage = useCallback((ebookToLoad = null) => {
    if (ebookToLoad) {
      if (localStorage.getItem("ebooks")) {
        let ebooks = JSON.parse(localStorage.getItem("ebooks"));
        let resp = ebooks.filter((ebook) => ebook.title == ebookToLoad);
        if (resp && resp.length > 0) {
          let loadedEbook = resp[0];
          const parsedData = loadedEbook.bookData;
          setEbookTitle(parsedData.title || "Untitled Ebook");
          setChapters(parsedData.chapters || []);
          setCurrentChapter(parsedData.currentChapter || null);
          setSystemPrompts(parsedData.systemPrompts || []);
          setParameters(parsedData.parameters || []);
        }
      }
    } else {
      const savedData = localStorage.getItem("currentEbook");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setEbookTitle(parsedData.title || "Untitled Ebook");
        setChapters(parsedData.chapters || []);
        setCurrentChapter(parsedData.currentChapter || null);
        setSystemPrompts(parsedData.systemPrompts || []);
        setParameters(parsedData.parameters || []);
      }

      // Load ebooks list
      let savedEbooks = localStorage.getItem("ebooks");
      if (savedEbooks) {
        savedEbooks = JSON.parse(savedEbooks);
        setEbooks(savedEbooks);
      }
    }
  }, []);

  useEffect(() => {
    loadFromLocalStorage();
    init();
  }, [loadFromLocalStorage]);

  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (!isSaved) {
        saveToLocalStorage();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(saveTimer);
  }, [isSaved, saveToLocalStorage]);

  useEffect(() => {
    if (chapterRefs.current[currentChapter - 1]) {
      chapterRefs.current[currentChapter - 1].scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [currentChapter]);

  useEffect(() => {
    if (chapters && chapters.length > 0) {
      setIsSaved(false);
    }
  }, [chapters]);

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
      //   console.log(data.prompts);
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

  const updateChapterContent = (
    chapterId,
    paragraphId,
    content,
    updatedSummary = null,
    streaming = false,
    updatingSummary = false
  ) => {
    // console.log("updateChapterContent " + paragraphId);
    setChapters((prevChapters) => {
      const newChapters = [...prevChapters];
      const chapterIndex = newChapters.findIndex(
        (chapter) => chapter.id === chapterId
      );
      if (chapterIndex !== -1) {
        const paragraphs = newChapters[chapterIndex].content
          .split("\n\n")
          .filter((p) => p.trim() !== "");
        paragraphs[paragraphId] = content;
        // console.log(paragraphs);
        newChapters[chapterIndex].content = paragraphs.join("\n\n");
        newChapters[chapterIndex].streaming = streaming;
        newChapters[chapterIndex].updatingSummary = updatingSummary;
        if (updatedSummary) {
          // console.log("updatedSummary " + newChapters[chapterIndex].summary);
          newChapters[chapterIndex].summary = updatedSummary;
        }
      }
      return newChapters;
    });
  };

  const handleRewriteParagraph = async (chapterId, paragraphId, prompt) => {
    console.log("Rewrite paragraph in chapter:", chapterId);
    console.log("Paragraph index:", paragraphId);
    console.log("With prompt:", prompt);

    let paragraphs = chapters[chapterId - 1].content.split("\n\n");

    let paragraph = paragraphs[paragraphId];
    let previousParagraph = paragraphId != 0 ? paragraphs[paragraphId - 1] : "";
    let nextParagraph =
      paragraphId < paragraphs.length - 1 ? paragraphs[paragraphId + 1] : "";

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/chapter/rewrite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paragraph,
            previousParagraph: previousParagraph,
            previousSummary: chapters[chapterId - 1].summary,
            systemPrompt: systemPrompts[0],
            instruction: prompt,
          }),
        }
      );

      const data = await response.json();
      console.log(data);
      if (data.updatedParagraph === undefined) {
        return { error: "ERror" };
      }
      return {
        newParagraph: data.updatedParagraph,
        newSummary: data.updatedSummary,
      };
    } catch (error) {
      console.error("Error fetching rewritten paragraph:", error);
      return { error: "ERror" };
    }
  };

  const handleReviewApply = async (chapterId, paragraphId, newContent) => {
    updateChapterContent(chapterId, paragraphId, newContent);
    closeMenu(chapterId);
  };

  const handleContinueChapter = async (chapterId, instruction) => {
    console.log("Continue chapter:", chapterId);
    let newParagraph = "";
    let updatedSummary = "";

    const paragraphs = chapters[chapterId - 1].content
      .split("\n\n")
      .filter((p) => p.trim() !== "");

    const onChunk = (data) => {
      if (data.chunk) {
        if (data.chunk !== "[DONE]") {
          newParagraph += data.chunk + " ";
          updateChapterContent(
            chapterId,
            paragraphs.length,
            newParagraph,
            null,
            true
          );
        } else {
          updateChapterContent(
            chapterId,
            paragraphs.length,
            newParagraph,
            null,
            false,
            true
          );
        }
      } else if (data.summary) {
        updatedSummary = data.summary;
        // console.log("got summary ", updatedSummary);
        updateChapterContent(
          chapterId,
          paragraphs.length,
          newParagraph,
          updatedSummary,
          false,
          false
        );
      }
    };

    const onError = (error) => {
      console.error("Error fetching continue chapter response:", error);
      // Handle error in UI
    };

    try {
      await streamedApiCall(
        `${process.env.REACT_APP_API_URL}/chapter/continue`,
        "POST",
        {
          summary: chapters[chapterId - 1].summary,
          previousParagraph: paragraphs[paragraphs.length - 1],
          systemPrompt: systemPrompts[0],
          instruction: instruction,
        },
        onChunk,
        onError
      );

      return { newParagraph };
    } catch (error) {
      return { error: "Error" };
    }
  };

  const handleDeleteParagraph = async (chapterId, paragraphId) => {
    console.log("Deleting Paragraph ", chapterId, paragraphId);
    setChapters((prevChapters) => {
      const newChapters = [...prevChapters];
      const chapterIndex = newChapters.findIndex(
        (chapter) => chapter.id === chapterId
      );

      if (chapterIndex !== -1) {
        let paragraphs = newChapters[chapterIndex].content
          .split("\n\n")
          .filter((p) => p.trim() !== "");

        // Remove the specified paragraph
        paragraphs.splice(paragraphId, 1);

        // If it was the last paragraph, add an empty one
        if (paragraphs.length === 0) {
          // paragraphs.push("New paragraph");
        }

        // Join the paragraphs back into a single string
        newChapters[chapterIndex].content = paragraphs.join("\n\n");
      }

      return newChapters;
    });
  };

  const handleInsertParagraph = async (chapterId, paragraphId, instruction) => {
    console.log("Add paragraph in chapter:", chapterId);
    console.log("Paragraph index:", paragraphId);
    console.log("With prompt:", instruction);

    let paragraphs = chapters[chapterId - 1].content
      .split("\n\n")
      .filter((p) => p.trim() !== "");
    // console.log(paragraphs);
    let previousParagraph = paragraphs[paragraphId];
    let nextParagraph =
      paragraphId < paragraphs.length - 1 ? paragraphs[paragraphId + 1] : "";

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/chapter/insert`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemPrompt: systemPrompts[0],
            summary: chapters[chapterId - 1].summary,
            instruction: instruction,
            previousParagraph: previousParagraph,
            nextParagraph: nextParagraph,
          }),
        }
      );

      const data = await response.json();
      //   console.log(data);
      if (data.insertedParagraph === undefined) {
        return { error: "Error" };
      }

      setChapters((prevChapters) => {
        const newChapters = [...prevChapters];
        const chapterIndex = newChapters.findIndex(
          (chapter) => chapter.id === chapterId
        );
        if (chapterIndex !== -1) {
          let paragraphs = newChapters[chapterIndex].content.split("\n\n");
          // remove paragraph with empty string
          paragraphs = paragraphs.filter((p) => p.trim() !== "");
          paragraphs.splice(paragraphId + 1, 0, data.insertedParagraph);
          newChapters[chapterIndex].content = paragraphs.join("\n\n");
        }
        return newChapters;
      });
      closeMenu(chapterId);
      return { newParagraph: data.insertedParagraph };
    } catch (error) {
      console.error("Error fetching inserted paragraph:", error);
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

  const handleEbookSelect = (selectedEbookTitle) => {
    loadFromLocalStorage(selectedEbookTitle);
    setIsEbookListOpen(false);
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
    setIsSaved(false);
  };

  const createNewEbook = () => {
    const newEbookTitle = "New Ebook";
    const newEbook = {
      title: newEbookTitle,
      chapters: [],
      currentChapter: null,
      systemPrompts: [],
      parameters: [],
      lastModified: new Date().toISOString(),
    };

    // Save new ebook to localStorage
    localStorage.setItem(newEbookTitle, JSON.stringify(newEbook));

    // Update ebooks list
    const updatedEbooks = [
      ...ebooks,
      { title: newEbookTitle, lastModified: newEbook.lastModified },
    ];
    localStorage.setItem("ebooks", JSON.stringify(updatedEbooks));
    setEbooks(updatedEbooks);

    // Load the new ebook
    loadFromLocalStorage(newEbookTitle);
    setIsEbookListOpen(false);
  };

  const deleteChapter = (chapterId) => {
    setChapters((prevChapters) =>
      prevChapters.filter((chapter) => chapter.id !== chapterId)
    );
    if (currentChapter === chapterId) {
      setCurrentChapter(null);
    }
    setIsSaved(false);
  };

  const deleteEbook = (ebookTitle) => {
    // Remove from localStorage
    localStorage.removeItem(ebookTitle);

    // Update ebooks list
    const updatedEbooks = ebooks.filter((ebook) => ebook.title !== ebookTitle);
    localStorage.setItem("ebooks", JSON.stringify(updatedEbooks));
    setEbooks(updatedEbooks);

    // If the deleted ebook was the current one, load the first available ebook or create a new one
    if (ebookTitle === ebookTitle) {
      if (updatedEbooks.length > 0) {
        loadFromLocalStorage(updatedEbooks[0].title);
      } else {
        createNewEbook();
      }
    }
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

  const Header = () => (
    <header className="bg-blue-600 text-white p-1 shadow-md flex justify-between items-center z-30 relative">
      <div className="flex items-center">
        {isEditingTitle ? (
          <input
            type="text"
            value={ebookTitle}
            onChange={(e) => setEbookTitle(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyPress={(e) => e.key === "Enter" && setIsEditingTitle(false)}
            className="text-xl font-bold bg-blue-500 px-2 py-1 rounded"
            autoFocus
          />
        ) : (
          <h1
            className="text-xl font-bold cursor-pointer"
            onClick={() => setIsEbookListOpen(true)}
          >
            {ebookTitle}
          </h1>
        )}
        <button
          onClick={() => setIsEditingTitle(!isEditingTitle)}
          className="ml-2 text-white hover:text-gray-200"
        >
          <FaEdit />
        </button>
      </div>
      {currentChapter && (
        <p className="text-sm">{chapters[currentChapter - 1].title}</p>
      )}
      <div className="flex items-center">
        <span className="text-sm mr-4">
          {isSaved ? `Last saved: ${lastSavedTime}` : "Saving..."}
        </span>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Chapters
        </button>
      </div>
    </header>
  );

  const bookContextValue = {
    chapters,
    handleParagraphSelect,
    handleDeleteParagraph,
    handleContinueChapter,
    handleRewriteParagraph,
    handleReviewApply,
    handleInsertParagraph,
    handleSummaryUpdate,
  };

  return (
    <BookProvider value={bookContextValue}>
      <div className="h-full flex flex-col bg-gray-100">
        <Header />
        <div className="flex-grow overflow-hidden relative">
          <Sidebar
            items={chapters}
            currentItem={currentChapter}
            onItemClick={navigateChapter}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            title="Chapters"
            onDeleteItem={deleteChapter}
          />
          <Sidebar
            items={ebooks}
            currentItem={ebookTitle}
            onItemClick={handleEbookSelect}
            isOpen={isEbookListOpen}
            onClose={() => setIsEbookListOpen(false)}
            title="Ebooks"
            onNewItem={createNewEbook}
            onDeleteItem={deleteEbook}
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
                  selectedParagraph={selectedParagraphs[chapter.id]}
                  onCloseMenu={closeMenu}
                />
              ))}
            </div>
          </main>
        </div>
        <div className="hidden sm:block">
          <Footer />
        </div>
      </div>
    </BookProvider>
  );
}

export default BookView;
