import React, { useState, useCallback } from "react";
import {
  FaPlus,
  FaBook,
  FaTrash,
  FaLightbulb,
  FaListUl,
  FaSpinner,
} from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";

import CollapsiblePanel from "../../components/CollapsiblePanel";
import { useEbook } from "../../context/EbookContext";
import { getSugggestedList } from "../../server/ebook";

const fetchSuggestedChapters = async (context) => {
  let chapters = (await getSugggestedList("chapters", "", context)).chapters;
  return chapters;
};

const ChapterList = () => {
  const { ebookState, chapterActions } = useEbook();
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [suggestedChapters, setSuggestedChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChapterClick = (chapterId) => {
    chapterActions.setCurrentChapter(chapterId);
  };

  const handleSuggestChapters = useCallback(async () => {
    let prevChapters = ebookState.chapters.map((c) => ({
      title: c.title,
      synopsis: c.synopsis,
    }));

    const chapterContext = {
      parameters: ebookState.parameters,
      previous_chapters: prevChapters,
    };
    setSuggestedChapters([]);
    setIsLoading(true);
    try {
      const suggestions = await fetchSuggestedChapters(chapterContext);
      setSuggestedChapters(suggestions);
    } catch (error) {
      console.error("Error fetching chapter suggestions:", error);
    }
    setIsLoading(false);
  }, [ebookState.parameters, ebookState.chapters]);

  const handleAddChapter = () => {
    let newChapter = {
      id: uuidv4(),
      title: "New Chapter",
      synopsis: "This is a synopsis.",
      sections: [],
    };
    chapterActions.addChapter(newChapter);
  };

  const handleAddSuggestedChapter = useCallback(
    (suggestedChapter) => {
      const newChapter = {
        id: uuidv4(),
        title: suggestedChapter.title,
        synopsis: suggestedChapter.synopsis,
        sections: [],
      };
      chapterActions.addChapter(newChapter);
      setSuggestedChapters((prevSuggestions) =>
        prevSuggestions.filter((ch) => ch.title !== suggestedChapter.title)
      );
    },
    [chapterActions]
  );

  const handleDeleteClick = (e, chapterId) => {
    e.stopPropagation();
    setDeleteConfirmId(chapterId);
  };

  const handleConfirmDelete = (e, chapterId) => {
    e.stopPropagation();
    chapterActions.deleteChapter(chapterId);
    setDeleteConfirmId(null);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  return (
    <CollapsiblePanel title="Chapters" icon={FaListUl}>
      <div className="flex justify-end space-x-2 mb-4">
        <button
          onClick={handleSuggestChapters}
          disabled={isLoading}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full flex items-center transition-colors duration-200"
        >
          {isLoading ? (
            <FaSpinner className="w-5 h-5 animate-spin" />
          ) : (
            <FaLightbulb className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={handleAddChapter}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center transition-colors duration-200"
        >
          <FaPlus className="mr-2" />
          Add Chapter
        </button>
      </div>

      <div className="space-y-4">
        {/* Existing chapters */}
        {ebookState.chapters.length > 0 && (
          <ul className="space-y-2">
            {ebookState.chapters.map((chapter, index) => (
              <li
                key={chapter.id}
                className={`
                  p-3 rounded-lg cursor-pointer transition-colors duration-200 flex justify-between items-center
                  ${
                    ebookState.currentChapter === chapter.id
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100"
                  }
                `}
                onClick={() => handleChapterClick(chapter.id)}
              >
                <div className="flex items-center">
                  <FaBook className="mr-3 text-gray-500" />
                  <span className="font-medium">
                    Chapter {index + 1}: {chapter.title}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3 text-sm text-gray-500">
                    {chapter.sections.length} section
                    {chapter.sections.length !== 1 ? "s" : ""}
                  </span>
                  {deleteConfirmId === chapter.id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleConfirmDelete(e, chapter.id)}
                        className="text-red-600 hover:text-red-800 transition-colors duration-200"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={handleCancelDelete}
                        className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleDeleteClick(e, chapter.id)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Suggested chapters */}
        {suggestedChapters.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Suggested Chapters
            </h3>
            <ul className="space-y-2">
              {suggestedChapters.map((chapter, index) => (
                <li
                  key={`suggested-${index}`}
                  className="p-3 rounded-lg bg-yellow-50 border border-yellow-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-yellow-800">
                        {chapter.title}
                      </span>
                      <p className="text-sm text-yellow-600">
                        {chapter.synopsis}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddSuggestedChapter(chapter)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-full text-sm transition-colors duration-200"
                    >
                      Add
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No chapters message */}
        {ebookState.chapters.length === 0 && suggestedChapters.length === 0 && (
          <p className="text-gray-500 text-center">
            No chapters yet. Add one or get suggestions to get started!
          </p>
        )}
      </div>
    </CollapsiblePanel>
  );
};

export default ChapterList;
