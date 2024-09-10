import React, { useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useEbook } from "../../context/EbookContext";
import SuggestableInput from "../../components/SuggestableInput";

const ContinueChapter = ({ chapterId, onClose }) => {
  const { chapterActions, ebookState } = useEbook();
  const [instruction, setInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const chapter = ebookState.chapters.find((c) => c.id === chapterId);

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

  const handleSuggestedContent = (suggestedContent) => {
    setInstruction(suggestedContent);
  };

  return (
    <div className="mt-4 bg-white rounded-lg shadow-md p-4">
      <h3 className="text-xl font-semibold mb-2 text-gray-800">
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
          previous_paragraphs: chapter.paragraphs,
        }}
        multiline={true}
        rows={4}
        placeholder="Enter instructions to continue chapter..."
        className="w-full p-3 border rounded-md resize-none"
      />
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

export default ContinueChapter;
