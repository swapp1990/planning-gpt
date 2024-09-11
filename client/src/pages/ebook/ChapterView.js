import React, { useEffect, useState, useCallback, useRef } from "react";
import { useEbook } from "../../context/EbookContext";
import { FaEdit, FaCheck, FaTimes, FaArrowDown } from "react-icons/fa";

import Synopsis from "./Synopsis";
import Paragraph from "./Paragraph";
import ContinueChapter from "./ContinueChapter";

const ChapterView = ({ chapter }) => {
  const { chapterActions } = useEbook();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isContinueChapter, setIsContinueChapter] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chapter.title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const continueButtonRef = useRef(null);

  useEffect(() => {
    setEditedTitle(chapter.title);
  }, [chapter.title]);

  const handleTitleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await chapterActions.updateChapterTitle(chapter.id, editedTitle);
      setIsEditingTitle(false);
    } catch (err) {
      setError("Failed to update chapter title. Please try again.");
    }
    setIsLoading(false);
  };

  const handleSynopsisEdit = async (newSynopsis) => {
    setIsLoading(true);
    setError(null);
    try {
      await chapterActions.updateChapter(chapter.id, { synopsis: newSynopsis });
    } catch (err) {
      setError("Failed to update synopsis. Please try again.");
    }
    setIsLoading(false);
  };

  const handleParagraphEdit = async (index, newContent) => {
    setIsLoading(true);
    setError(null);
    try {
      await chapterActions.updateParagraph(chapter.id, index, newContent);
    } catch (err) {
      setError("Failed to update paragraph. Please try again.");
    }
    setIsLoading(false);
  };

  const handleParagraphDelete = async (index) => {
    setIsLoading(true);
    setError(null);
    try {
      await chapterActions.deleteParagraph(chapter.id, index);
    } catch (err) {
      console.log(err);
      setError("Failed to delete paragraph. Please try again.");
    }
    setIsLoading(false);
  };

  const scrollToContinueButton = useCallback(() => {
    if (continueButtonRef.current) {
      continueButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-2 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        {isEditingTitle ? (
          <div className="flex-grow">
            <input
              type="text"
              className="w-full p-2 text-2xl font-bold border rounded"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
            />
            <div className="mt-2 flex justify-end space-x-2">
              <button
                onClick={handleTitleSave}
                className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
                disabled={isLoading}
              >
                <FaCheck />
              </button>
              <button
                onClick={() => setIsEditingTitle(false)}
                className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={isLoading}
              >
                <FaTimes />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center flex-grow">
            <h2 className="text-2xl font-bold mr-2">{chapter.title}</h2>
            <button
              onClick={() => setIsEditingTitle(true)}
              className="p-1 text-blue-500 hover:text-blue-600"
              aria-label="Edit chapter title"
            >
              <FaEdit className="w-5 h-5" />
            </button>
          </div>
        )}
        <button
          onClick={scrollToContinueButton}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          aria-label="Scroll to bottom of chapter"
        >
          <FaArrowDown className="w-5 h-5" />
        </button>
      </div>
      <Synopsis
        chapter={chapter}
        chapterId={chapter.id}
        onEdit={handleSynopsisEdit}
      />
      {chapter.content.map((p, index) => (
        <Paragraph
          key={index}
          content={p}
          index={index}
          chapterId={chapter.id}
          onEdit={handleParagraphEdit}
          onDelete={handleParagraphDelete}
        />
      ))}

      {isContinueChapter ? (
        <ContinueChapter
          chapterId={chapter.id}
          onClose={() => setIsContinueChapter(false)}
        />
      ) : (
        <button
          onClick={() => setIsContinueChapter(true)}
          ref={continueButtonRef}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
        >
          Continue
        </button>
      )}

      {isLoading && <p className="mt-4 text-gray-600">Loading...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default ChapterView;
