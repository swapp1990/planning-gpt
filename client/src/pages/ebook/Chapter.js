import React, { useState, useEffect } from "react";
import { FaPlus, FaCheck, FaEdit, FaEraser } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useBook } from "./BookContext";
import Paragraph from "./Paragraph";

const Summary = ({ summary, chapterId, isUpdatingSummary }) => {
  const { handleSummaryUpdate } = useBook();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editedSummary, setEditedSummary] = useState(summary);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedSummary(summary);
  };

  const handleSubmitEdit = async () => {
    setIsLoading(true);
    const response = await handleSummaryUpdate(chapterId, editedSummary);
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

const Chapter = React.forwardRef(
  ({ chapter, selectedParagraph, onCloseMenu }, ref) => {
    const { handleContinueChapter } = useBook();
    const [isContinueOpen, setIsContinueOpen] = useState(false);
    const [newParagraphContent, setNewParagraphContent] = useState("");
    const [paragraphs, setParagraphs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isUpdatingSummary, setIsUpdatingSummary] = useState(false);

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
      setNewParagraphContent("");
    };

    const handleSubmitContinue = async () => {
      setError(null);
      setIsLoading(true);
      let response = await handleContinueChapter(
        chapter.id,
        newParagraphContent
      );
      if (response.newParagraph) {
        setIsContinueOpen(false);
        setNewParagraphContent("");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setError("An error occurred. Please try again later.");
      }
    };

    return (
      <div ref={ref} className="mb-8 p-2 sm:p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          {chapter.title}
        </h2>
        <Summary
          summary={chapter.summary}
          chapterId={chapter.id}
          isUpdatingSummary={isUpdatingSummary}
        />
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
          <div className="mt-4">
            <textarea
              className="w-full p-2 border rounded-md"
              rows="4"
              placeholder="Enter new paragraph content..."
              value={newParagraphContent}
              onChange={(e) => setNewParagraphContent(e.target.value)}
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={handleCancelContinue}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitContinue}
                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-spin mr-2">&#9696;</span>
                ) : (
                  <FaCheck size={16} className="mr-1" />
                )}
                {isLoading ? "Writing..." : "Submit"}
              </button>
            </div>
            {error && (
              <div className="mt-2">
                <p className="text-center text-sm text-red-500">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default Chapter;
