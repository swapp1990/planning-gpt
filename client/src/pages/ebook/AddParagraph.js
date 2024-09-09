import React, { useState, useContext, useEffect } from "react";
import { FaCheck, FaTimes, FaLightbulb } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useEbook } from "../../context/EbookContext";
import { regularApiCall } from "../../utils/api";

const AddParagraph = ({ chapterId, onClose }) => {
  const { chapterActions, ebookState } = useEbook();
  const [instruction, setInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const chapter = ebookState.chapters.find((c) => c.id === chapterId);

  useEffect(() => {
    if (isSuggestionsOpen) {
      fetchSuggestions();
    }
  }, [isSuggestionsOpen]);

  const fetchSuggestions = async () => {
    setIsFetchingSuggestions(true);
    setError(null);

    const previousParagraph =
      chapter.paragraphs[chapter.paragraphs.length - 1] || "";

    try {
      const response = await regularApiCall(
        `${process.env.REACT_APP_API_URL}/chapter/continue/suggestions`,
        "POST",
        {
          parameters: ebookState.parameters,
          chapter_synopsis: chapter.synopsis,
          previous_paragraph: previousParagraph,
          n_suggestions: 3,
        }
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const parsedSuggestions = JSON.parse(response.suggestions);
      setSuggestions(parsedSuggestions.map((s) => s.suggestion));
    } catch (err) {
      setError("Failed to fetch suggestions. Please try again.");
    }

    setIsFetchingSuggestions(false);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await chapterActions.continueChapter(
        chapterId,
        instruction
      );
      if (response.error) {
        setError(response.error);
      } else {
        setInstruction("");
        onClose();
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInstruction(suggestion);
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
          placeholder="Enter instructions to continue chapter..."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
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
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center"
        >
          <FaTimes size={16} className="mr-2" />
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
          disabled={isLoading || instruction.trim() === ""}
        >
          {isLoading ? (
            <AiOutlineLoading3Quarters className="animate-spin mr-2" />
          ) : (
            <FaCheck size={16} className="mr-2" />
          )}
          {isLoading ? "Generating..." : "Submit"}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-center text-sm text-red-500">{error}</div>
      )}
    </div>
  );
};

export default AddParagraph;
