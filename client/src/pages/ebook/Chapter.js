import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaCheck,
  FaEdit,
  FaEraser,
  FaTimes,
  FaLightbulb,
} from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useBook } from "./BookContext";
import Paragraph from "./Paragraph";
import { regularApiCall } from "../../utils/api";

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

const ContinueChapter = ({ onSubmit, onCancel, chapterId, summary }) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setIsFetchingSuggestions(true);
    setError(null);

    const response = await regularApiCall(
      `${process.env.REACT_APP_API_URL}/chapter/continue/suggestions`,
      "POST",
      {
        chapterId,
        summary,
      }
    );

    if (response.error) {
      setError("Failed to fetch suggestions. Please try again.");
    } else {
      setSuggestions(response.suggestions || []);
    }

    setIsFetchingSuggestions(false);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(content);
      setContent("");
      setIsLoading(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setContent(suggestion);
    setIsSuggestionsOpen(false);
  };

  return (
    <div className="mt-4 bg-white rounded-lg shadow-md p-4">
      <h3 className="text-xl font-semibold mb-2 text-gray-800">
        Continue Chapter
      </h3>
      <div className="relative">
        <textarea
          className="w-full p-3 border rounded-md resize-none"
          rows="4"
          placeholder="Enter new paragraph content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          title="Show suggestions"
        >
          <FaLightbulb size={20} />
        </button>
      </div>
      {isSuggestionsOpen && (
        <div className="mt-2 bg-gray-100 rounded-md p-2 max-h-40 overflow-y-auto">
          <h4 className="font-semibold mb-2 text-sm text-gray-700">
            Suggestions:
          </h4>
          {isFetchingSuggestions ? (
            <div className="flex justify-center items-center h-20">
              <AiOutlineLoading3Quarters
                className="animate-spin text-gray-500"
                size={24}
              />
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-2 text-sm hover:bg-gray-200 rounded transition-colors duration-200"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No suggestions available.</p>
          )}
        </div>
      )}
      <div className="flex justify-end mt-2 space-x-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center"
        >
          <FaTimes size={16} className="mr-2" />
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
          disabled={isLoading || content.trim() === ""}
        >
          {isLoading ? (
            <AiOutlineLoading3Quarters className="animate-spin mr-2" />
          ) : (
            <FaCheck size={16} className="mr-2" />
          )}
          {isLoading ? "Submitting..." : "Submit"}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-center text-sm text-red-500">{error}</div>
      )}
    </div>
  );
};

const Chapter = React.forwardRef(
  ({ chapter, selectedParagraph, onCloseMenu }, ref) => {
    const { handleContinueChapter } = useBook();
    const [isContinueOpen, setIsContinueOpen] = useState(false);
    const [paragraphs, setParagraphs] = useState([]);
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
    };

    const handleSubmitContinue = async (content) => {
      const response = await handleContinueChapter(chapter.id, content);
      if (response.newParagraph) {
        setIsContinueOpen(false);
      } else {
        throw new Error("Failed to continue chapter");
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
          <ContinueChapter
            onSubmit={handleSubmitContinue}
            onCancel={handleCancelContinue}
            chapterId={chapter.id}
            summary={chapter.summary}
          />
        )}
      </div>
    );
  }
);

export default Chapter;
