import React, { useState } from "react";
import { FaPlus, FaBook, FaTrash } from "react-icons/fa";
import { useEbook } from "../../context/EbookContext";
import { v4 as uuidv4 } from "uuid";

const ChapterList = () => {
  const { ebookState, chapterActions } = useEbook();
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleChapterClick = (chapterId) => {
    console.log(chapterId);
    chapterActions.setCurrentChapter(chapterId);
  };

  const handleAddChapter = () => {
    let newChapter = {
      id: uuidv4(),
      title: "Test Title",
      synopsis: "This is a synopsis.",
      content: [],
    };
    chapterActions.addChapter(newChapter);
  };

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
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Chapters</h2>
        <button
          onClick={handleAddChapter}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center transition-colors duration-200"
        >
          <FaPlus className="mr-2" />
          Add Chapter
        </button>
      </div>
      {ebookState.chapters.length === 0 ? (
        <p className="text-gray-500 text-center">
          No chapters yet. Add one to get started!
        </p>
      ) : (
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChapterList;
