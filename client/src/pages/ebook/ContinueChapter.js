import React, { useState, useCallback } from "react";
import { FaCheck, FaTimes, FaOutdent } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useEbook } from "../../context/EbookContext";
import SuggestableInput from "../../components/SuggestableInput";
import { getSuggestedOutlines } from "../../server/ebook";

const ContinueChapter = ({ chapterId, onClose }) => {
  const { chapterActions, ebookState } = useEbook();
  const [instruction, setInstruction] = useState("");
  const [paragraphCount, setParagraphCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generateOutlines, setGenerateOutlines] = useState(false);
  const [outlines, setOutlines] = useState([]);

  const chapter = ebookState.chapters.find((c) => c.id === chapterId);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (generateOutlines) {
        // Simulate outlines for now
        let outlines = await getSuggestedOutlines(
          chapter.synopsis,
          instruction,
          paragraphCount
        );
        outlines = outlines.map((o) => o.outline);

        setOutlines(outlines);
      } else {
        const response = await chapterActions.continueChapter(
          chapterId,
          instruction,
          paragraphCount
        );
        if (response.error) {
          setError(response.error);
        } else {
          setInstruction("");
          onClose();
        }
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedContent = (suggestedContent) => {
    setInstruction(suggestedContent);
  };

  const handleOutlineClick = useCallback(
    async (outline) => {
      setIsLoading(true);
      try {
        await chapterActions.continueChapter(
          chapterId,
          outline,
          paragraphCount
        );
        setOutlines(outlines.filter((o) => o !== outline));
      } catch (err) {
        console.error("Error expanding outline:", err);
        setError("Failed to expand outline. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [chapterId, chapterActions, outlines, paragraphCount]
  );

  return (
    <div className="mt-2 sm:mt-6 bg-white rounded-lg shadow-lg p-6 transition-all duration-300 ease-in-out">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        Continue Chapter
      </h3>
      <SuggestableInput
        value={instruction}
        onChange={setInstruction}
        onSuggest={handleSuggestedContent}
        label="continue_chapter"
        context={{
          parameters: ebookState.parameters,
          chapter_synopsis: chapter.synopsis,
          previous_paragraphs: chapter.content.slice(-3),
        }}
        multiline={true}
        rows={4}
        placeholder="Enter instructions to continue chapter..."
        className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
      />
      <div className="mt-6 flex flex-wrap items-center justify-between">
        <div className="w-full sm:w-2/3 mb-4 sm:mb-0">
          <label
            htmlFor="paragraphCount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Number of paragraphs:{" "}
            <span className="font-bold text-blue-600">{paragraphCount}</span>
          </label>
          <div className="relative">
            <input
              type="range"
              id="paragraphCount"
              min="1"
              max="10"
              value={paragraphCount}
              onChange={(e) => setParagraphCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="absolute -top-2 left-0 right-0 flex justify-between text-xs text-gray-500">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <span
                  key={num}
                  className={`${
                    paragraphCount === num ? "text-blue-600 font-bold" : ""
                  }`}
                >
                  |
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full sm:w-1/3 flex items-center justify-end">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={generateOutlines}
              onChange={() => setGenerateOutlines(!generateOutlines)}
              className="form-checkbox h-5 w-5 text-blue-600 transition duration-150 ease-in-out"
            />
            <span className="ml-2 text-sm text-gray-700">
              Generate Outlines
            </span>
          </label>
        </div>
      </div>
      {outlines.length > 0 && (
        <div className="mt-4 space-y-2">
          {outlines.map((outline, index) => (
            <div
              key={index}
              onClick={() => handleOutlineClick(outline)}
              className="p-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200 transition-colors duration-200 flex items-center"
            >
              <FaOutdent className="mr-2 text-gray-600" />
              <span className="text-sm text-gray-800">{outline}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-end mt-6 space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
        >
          <FaTimes size={16} className="mr-2" />
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
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
        <div className="mt-4 text-center text-sm text-red-500 bg-red-100 p-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default ContinueChapter;
