import React, { useState, useCallback } from "react";
import { FaCheck, FaTimes, FaParagraph, FaListUl } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useEbook } from "../../context/EbookContext";
import SuggestableInput from "../../components/SuggestableInput";
import { getSuggestedOutlines } from "../../server/ebook";
import OutlineSection from "./OutlineSection";

const ContinueChapter = ({ chapterId, onClose }) => {
  const { chapterActions, ebookState } = useEbook();
  const [instruction, setInstruction] = useState("");
  const [paragraphCount, setParagraphCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [outlines, setOutlines] = useState([]);
  const [mode, setMode] = useState("direct"); // "direct" or "outline"

  const chapter = ebookState.chapters.find((c) => c.id === chapterId);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (mode === "direct") {
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
      } else {
        let generatedOutlines = await getSuggestedOutlines(
          chapter.synopsis,
          instruction,
          paragraphCount
        );
        setOutlines(
          generatedOutlines.map((o) => ({ text: o.outline, status: "pending" }))
        );
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
            await chapterActions.continueChapter(
              chapterId,
              outline.text,
              paragraphCount
            );
            setOutlines(
              outlines.map((o) =>
                o.text === outline.text ? { ...o, status: "generated" } : o
              )
            );
          } catch (err) {
            console.error("Error expanding outline:", err);
            setError("Failed to expand outline. Please try again.");
          } finally {
            setIsLoading(false);
          }
          break;
        case "delete":
          setOutlines(outlines.filter((o) => o.text !== outline.text));
          break;
        case "reload":
          // Implement outline reloading logic here
          console.log("Reload outline:", outline);
          break;
        default:
          console.error("Unknown outline action:", action);
      }
    },
    [outlines, chapterId, chapterActions, paragraphCount]
  );

  return (
    <div className="mt-2 sm:mt-6 bg-white rounded-lg shadow-lg p-6 transition-all duration-300 ease-in-out">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        Continue Chapter
      </h3>
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setMode("direct")}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              mode === "direct"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            } border border-gray-200 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700`}
          >
            <FaParagraph className="mr-2 inline" />
            Direct Generation
          </button>
          <button
            onClick={() => setMode("outline")}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              mode === "outline"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            } border border-gray-200 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700`}
          >
            <FaListUl className="mr-2 inline" />
            Outline Generation
          </button>
        </div>
      </div>
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
        placeholder={`Enter instructions to ${
          mode === "direct" ? "continue chapter" : "generate outlines"
        }...`}
        className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
      />
      <div className="mt-6 flex flex-wrap items-center justify-between">
        <div className="w-full sm:w-2/3 mb-4 sm:mb-0">
          <label
            htmlFor="paragraphCount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Number of {mode === "direct" ? "paragraphs" : "outlines"}:{" "}
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
      </div>
      {mode === "outline" && (
        <OutlineSection
          outlines={outlines}
          onOutlineAction={handleOutlineAction}
        />
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
          {isLoading
            ? "Generating..."
            : mode === "direct"
            ? "Generate Paragraphs"
            : "Generate Outlines"}
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
