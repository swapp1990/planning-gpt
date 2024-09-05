import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaBook,
  FaEdit,
  FaLightbulb,
} from "react-icons/fa";

import { streamedApiCall } from "../../utils/api";
import { useEbookStorage } from "../../utils/storage";

import Chapter from "./Chapter";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ParametersPanel from "./ParametersPanel";
import ChapterSuggestions from "./ChapterSuggestions";

import { BookProvider } from "./BookContext";

function BookView() {
  const {
    ebookTitle,
    setEbookTitle,
    chapters,
    setChapters,
    currentChapter,
    setCurrentChapter,
    systemPrompts,
    setSystemPrompts,
    parameters,
    setParameters,
    ebooks,
    isSaved,
    setIsSaved,
    lastSavedTime,
    loadFromLocalStorage,
    saveToLocalStorage,
    createNewEbook,
    deleteEbook,
  } = useEbookStorage();

  const [chatType, setChatType] = useState("writing_assistant");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedParagraphs, setSelectedParagraphs] = useState({});

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEbookListOpen, setIsEbookListOpen] = useState(false);

  const totalChapters = 0;
  const chapterRefs = useRef([]);

  useEffect(() => {
    loadFromLocalStorage();
    init();
  }, [loadFromLocalStorage]);

  useEffect(() => {
    if (chapterRefs.current[currentChapter - 1]) {
      chapterRefs.current[currentChapter - 1].scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [currentChapter]);

  useEffect(() => {
    if (chapters && chapters.length > 0) {
      // setIsSaved(false);
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
        newChapters[chapterIndex].streaming = streaming;
        newChapters[chapterIndex].updatingSummary = updatingSummary;
        if (content != null) {
          const paragraphs = newChapters[chapterIndex].content
            .split("\n\n")
            .filter((p) => p.trim() !== "");
          paragraphs[paragraphId] = content;
          // console.log(paragraphs);
          newChapters[chapterIndex].content = paragraphs.join("\n\n");
        }

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
      };
    } catch (error) {
      console.error("Error fetching rewritten paragraph:", error);
      return { error: "ERror" };
    }
  };

  const handleSummaryUpdateonRewrite = async (
    chapterId,
    paragraphId,
    newContent
  ) => {
    try {
      updateChapterContent(chapterId, paragraphId, null, null, false, true);
      let fullSummary = chapters[chapterId - 1].summary;
      // Split the fullSummary into sentences
      const summaryTokenizer = new RegExp("(?<=[.!?])\\s*", "g");
      const summarySentences = fullSummary
        .split(summaryTokenizer)
        .map((sentence) => sentence.trim());
      // console.log(summarySentences);

      let summarySentence = summarySentences[paragraphId + 1] || "";
      if (summarySentence == "") {
        console.error("No summary sentence found!");
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/chapter/rewrite/summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paragraph: newContent,
            fullSummary: fullSummary,
            summarySentence: summarySentence,
          }),
        }
      );

      const data = await response.json();
      summarySentences[paragraphId + 1] = data.newSummary;
      fullSummary = summarySentences.join(" ");

      updateChapterContent(
        chapterId,
        paragraphId,
        null,
        fullSummary,
        false,
        false
      );
    } catch (error) {
      console.error("Error fetching rewritten paragraph:", error);
      return { error: "ERror" };
    }
  };

  const handleReviewApply = async (chapterId, paragraphId, newContent) => {
    updateChapterContent(chapterId, paragraphId, newContent);
    handleSummaryUpdateonRewrite(chapterId, paragraphId, newContent);
    closeMenu(chapterId);
  };

  const handleContinueChapter = async (chapterId, instruction) => {
    console.log("Continue chapter:", chapterId);
    if (systemPrompts.length == 0) {
      return { error: "System Prompts is empty" };
    }
    let newParagraph = "";
    let updatedSummary = "";

    const paragraphs = chapters[chapterId - 1].content
      .split("\n\n")
      .filter((p) => p.trim() !== "");

    const previousChaptersSummaries = chapters
      .slice(0, chapterId - 1)
      .map(
        (chapter, index) =>
          `Chapter ${index + 1}: ${chapter.title}\n${chapter.summary}`
      )
      .join("\n\n");

    // console.log(previousChaptersSummaries);

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
          setIsSaved(false);
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
        setIsSaved(false);
      }
    };

    const onError = (error) => {
      console.error("Error fetching continue chapter response:", error);
      // Handle error in UI
    };
    console.log(parameters);
    try {
      await streamedApiCall(
        `${process.env.REACT_APP_API_URL}/chapter/continue`,
        "POST",
        {
          parameters: parameters,
          summary: chapters[chapterId - 1].summary,
          previousChapters: previousChaptersSummaries,
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

  const handleDeleteChapter = async (chapterId) => {
    setChapters((prevChapters) =>
      prevChapters.filter((chapter) => chapter.id !== chapterId)
    );
    if (currentChapter === chapterId) {
      setCurrentChapter(null);
    }
    setIsSaved(false);
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

        // Update summary
        let fullSummary = newChapters[chapterIndex].summary;
        const summaryTokenizer = new RegExp("(?<=[.!?])\\s*", "g");
        const summarySentences = fullSummary
          .split(summaryTokenizer)
          .map((sentence) => sentence.trim());
        if (summarySentences.length > paragraphId + 1) {
          summarySentences.splice(paragraphId + 1, 1);
        }
        newChapters[chapterIndex].summary = summarySentences.join(" ");
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
        summary: "Summary of the chapter.",
      },
    ]);
    setIsSaved(false);
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

  const handleParametersChange = (newParameters) => {
    setParameters(newParameters);
    setIsSaved(false);
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [chapterSuggestions, setChapterSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);

  const fetchChapterSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setSuggestionsError(null);
    let chapterSummaries = chapters.map((c) => ({
      title: c.title,
      summary: c.summary,
    }));
    console.log(chapterSummaries);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/chapter/suggestions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chapters: chapterSummaries,
            parameters: parameters,
            instruction: "instructions",
          }),
        }
      );

      const data = await response.json();
      setChapterSuggestions((prevSuggestions) => [
        ...prevSuggestions,
        ...data.suggestions,
      ]);
    } catch (error) {
      console.error("Error fetching chapter suggestions:", error);
      setSuggestionsError(error.message);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const deleteSetChapter = (chapterId) => {
    setChapters((prevChapters) =>
      prevChapters.filter((ch) => ch.id !== chapterId)
    );
  };

  const toggleSuggestions = () => {
    setShowSuggestions((prevState) => !prevState);
    if (!showSuggestions && chapterSuggestions.length === 0) {
      fetchChapterSuggestions();
    }
  };

  const addSuggestedChapter = (suggestion) => {
    setChapters((prevChapters) => [
      ...prevChapters,
      {
        id: prevChapters.length + 1,
        title: suggestion.title,
        content: "",
        summary: suggestion.summary,
      },
    ]);
    setChapterSuggestions((prevSuggestions) =>
      prevSuggestions.filter((s) => s.title !== suggestion.title)
    );
    setIsSaved(false);
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

  const bookContextValue = {
    chapters,
    handleParagraphSelect,
    handleDeleteParagraph,
    handleDeleteChapter,
    handleContinueChapter,
    handleRewriteParagraph,
    handleReviewApply,
    handleInsertParagraph,
    handleSummaryUpdate,
  };

  return (
    <BookProvider value={bookContextValue}>
      <div className="h-full flex flex-col bg-gray-100">
        <Header
          ebookTitle={ebookTitle}
          setEbookTitle={setEbookTitle}
          isEditingTitle={isEditingTitle}
          setIsEditingTitle={setIsEditingTitle}
          currentChapter={currentChapter}
          chapters={chapters}
          setIsSidebarOpen={setIsSidebarOpen}
          setIsEbookListOpen={setIsEbookListOpen}
        />
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
              <ParametersPanel
                parameters={parameters}
                onParametersChange={handleParametersChange}
              />
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
                <button
                  onClick={toggleSuggestions}
                  className={`px-4 py-2 rounded transition-colors text-white flex items-center ${
                    showSuggestions
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                  title="Toggle Chapter Suggestions"
                >
                  <FaLightbulb className="mr-2" />
                  {showSuggestions ? "Hide Suggestions" : "Show Suggestions"}
                </button>
              </div>
              {showSuggestions ? (
                <ChapterSuggestions
                  chapters={chapters}
                  suggestions={chapterSuggestions}
                  isLoading={isLoadingSuggestions}
                  error={suggestionsError}
                  onAddChapter={addSuggestedChapter}
                  onLoadMore={fetchChapterSuggestions}
                  onClose={() => setShowSuggestions(false)}
                />
              ) : (
                chapters.map((chapter, index) => (
                  <Chapter
                    key={chapter.id}
                    ref={(el) => (chapterRefs.current[index] = el)}
                    chapter={chapter}
                    selectedParagraph={selectedParagraphs[chapter.id]}
                    onCloseMenu={closeMenu}
                  />
                ))
              )}
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
