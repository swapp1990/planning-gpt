import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaCheck,
  FaEdit,
  FaEraser,
  FaTimes,
  FaLightbulb,
  FaTrash,
} from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useBook } from "./BookContext";
import Paragraph from "./Paragraph_old";
import ContinueChapter from "./ContinueChapter";

const Summary = ({ summary, chapterId, isUpdatingSummary }) => {
  const { handleSummaryUpdate } = useBook();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editedSummary, setEditedSummary] = useState(summary);

  useEffect(() => {
    setEditedSummary(summary);
  }, [summary]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedSummary(summary);
  };

  const handleSubmitEdit = async () => {
    setIsLoading(true);
    let finalSummary = editedSummary.trim();
    if (!finalSummary.endsWith(".")) {
      finalSummary += ".";
    }
    const response = await handleSummaryUpdate(chapterId, finalSummary);
    if (response.error) {
      setError(response.error);
    } else {
      setIsEditing(false);
      setError(null);
    }
    setIsLoading(false);
  };

  const handleClearText = () => {
    setEditedSummary("");
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-semibold text-gray-700">Summary</h3>
        {!isEditing && (
          <button
            onClick={handleEditClick}
            className="p-1 text-blue-500 hover:bg-blue-100 rounded-full transition-colors duration-200"
            title="Edit Summary"
          >
            <FaEdit size={16} />
          </button>
        )}
      </div>
      {isEditing ? (
        <div>
          <div className="relative">
            <textarea
              className="w-full p-2 border rounded-md pr-8"
              rows="4"
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
            />
            <button
              onClick={handleClearText}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              title="Clear text"
            >
              <FaEraser size={20} />
            </button>
          </div>
          <div className="flex justify-end mt-2 space-x-2">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitEdit}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-spin mr-2">&#9696;</span>
              ) : (
                <FaCheck size={16} className="mr-1" />
              )}
              {isLoading ? "Updating..." : "Submit"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 p-4 rounded-md h-24 overflow-y-auto relative">
          {isUpdatingSummary && (
            <AiOutlineLoading3Quarters className="inline-block ml-1 animate-spin text-green-500" />
          )}
          <p className="text-gray-600 pr-2">{summary}</p>
        </div>
      )}
      {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
    </div>
  );
};

const Synopsis = ({ synopsis, chapterId }) => {
  return (
    <div className="mb-6">
      <div className="bg-gray-100 p-4 rounded-md h-24 overflow-y-auto relative">
        <p className="text-gray-600 pr-2">{synopsis}</p>
      </div>
    </div>
  );
};

const Chapter = React.forwardRef(
  ({ chapter, selectedParagraph, onCloseMenu, isDeletingChapter }, ref) => {
    const { handleContinueChapter, handleDeleteChapter } = useBook();
    const [isContinueOpen, setIsContinueOpen] = useState(false);
    const [paragraphs, setParagraphs] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isUpdatingSummary, setIsUpdatingSummary] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
      setParagraphs(
        chapter.content
          .split("\n\n")
          .filter((p) => p.trim() !== "")
          .map((p) => p.trim())
      );
    }, [chapter.content]);

    useEffect(() => {
      setIsStreaming(chapter.streaming);
    }, [chapter.streaming]);

    useEffect(() => {
      setIsUpdatingSummary(chapter.updatingSummary);
    }, [chapter.updatingSummary]);

    const handleContinueClick = () => {
      setIsContinueOpen(true);
    };

    const handleCancelContinue = () => {
      setIsContinueOpen(false);
    };

    const handleSubmitContinue = async (content) => {
      const response = await handleContinueChapter(chapter.id, content);
      if (response.newParagraph) {
        setIsContinueOpen(false);
      } else {
        throw new Error("Failed to continue chapter");
      }
    };

    const handleDeleteClick = () => {
      setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
      handleDeleteChapter(chapter.id);
      setShowDeleteConfirm(false);
    };

    const handleCancelDelete = () => {
      setShowDeleteConfirm(false);
    };

    return (
      <div
        ref={ref}
        className="mb-8 p-2 sm:p-6 bg-white rounded-lg shadow-md relative"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-800">{chapter.title}</h2>
          <button
            onClick={handleDeleteClick}
            className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors duration-200"
            title="Delete Chapter"
          >
            <FaTrash size={20} />
          </button>
        </div>
        {/* <Summary
          summary={chapter.summary}
          chapterId={chapter.id}
          isUpdatingSummary={isUpdatingSummary}
        /> */}
        <Synopsis synopsis={chapter.synopsis} chapterId={chapter.id} />
        <div className="prose max-w-none">
          {paragraphs.map((paragraph, index) => (
            <Paragraph
              key={index}
              content={paragraph}
              isSelected={selectedParagraph === index}
              onCloseMenu={onCloseMenu}
              chapterId={chapter.id}
              paragraphIndex={index}
              isStreaming={isStreaming}
            />
          ))}
        </div>
        {!isContinueOpen ? (
          <button
            onClick={handleContinueClick}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
          >
            <FaPlus size={16} className="mr-2" />
            Continue Chapter
          </button>
        ) : (
          <ContinueChapter
            onSubmit={handleSubmitContinue}
            onCancel={handleCancelContinue}
            synopsis={chapter.synopsis}
            paragraphs={paragraphs}
          />
        )}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-start justify-center mt-4">
            <div className="bg-white p-4 rounded-lg shadow-md text-center">
              <p className="mb-4">
                Are you sure you want to delete this chapter?
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
                  disabled={isDeletingChapter}
                >
                  {isDeletingChapter ? (
                    <AiOutlineLoading3Quarters className="animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default Chapter;
