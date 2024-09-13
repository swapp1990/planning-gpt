import React, { useState, useCallback } from "react";
import { FaCheck, FaTimes, FaListUl } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useEbook } from "../../context/EbookContext";
import SuggestableInput from "../../components/SuggestableInput";
import { getSuggestedOutlines } from "../../server/ebook";
import OutlineSection from "./OutlineSection";

const ContinueChapter = ({ chapterId, onClose }) => {
  const { chapterActions, ebookState } = useEbook();
  const [instruction, setInstruction] = useState("");
  const [outlineCount, setOutlineCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [outlines, setOutlines] = useState([]);

  const chapter = ebookState.chapters.find((c) => c.id === chapterId);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      let generatedOutlines = await getSuggestedOutlines(
        chapter.synopsis,
        instruction,
        outlineCount
      );
      setOutlines(
        generatedOutlines.map((o) => ({ text: o.outline, status: "pending" }))
      );
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

  const handleOutlineAction = useCallback(
    async (action, outline, newText, paragraphCount) => {
      switch (action) {
        case "edit":
          setOutlines(
            outlines.map((o) =>
              o.text === outline.text ? { ...o, text: newText } : o
            )
          );
          break;
        case "submit":
          setIsLoading(true);
          try {
            const newSection = {
              outline: outline.text,
              paragraphs: Array(paragraphCount).fill(""), // Create empty paragraphs
            };
            await chapterActions.addSection(chapterId, newSection);
            setOutlines(
              outlines.map((o) =>
                o.text === outline.text ? { ...o, status: "generated" } : o
              )
            );
          } catch (err) {
            console.error("Error adding section:", err);
            setError("Failed to add section. Please try again.");
          } finally {
            setIsLoading(false);
          }
          break;
        case "delete":
          setOutlines(outlines.filter((o) => o.text !== outline.text));
          break;
        default:
          console.error("Unknown outline action:", action);
      }
    },
    [outlines, chapterId, chapterActions]
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
          previous_sections: chapter.sections.slice(-3),
        }}
        multiline={true}
        rows={4}
        placeholder="Enter instructions to generate outlines..."
        className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
      />
      <div className="mt-6 flex flex-wrap items-center justify-between">
        <div className="w-full sm:w-2/3 mb-4 sm:mb-0">
          <label
            htmlFor="outlineCount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Number of outlines:{" "}
            <span className="font-bold text-blue-600">{outlineCount}</span>
          </label>
          <div className="relative">
            <input
              type="range"
              id="outlineCount"
              min="1"
              max="10"
              value={outlineCount}
              onChange={(e) => setOutlineCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="absolute -top-2 left-0 right-0 flex justify-between text-xs text-gray-500">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <span
                  key={num}
                  className={`${
                    outlineCount === num ? "text-blue-600 font-bold" : ""
                  }`}
                >
                  |
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <OutlineSection
        outlines={outlines}
        onOutlineAction={handleOutlineAction}
      />
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
            <FaListUl size={16} className="mr-2" />
          )}
          {isLoading ? "Generating..." : "Generate Outlines"}
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
