import React, { useState } from "react";
import {
  FaMagic,
  FaRedo,
  FaSpinner,
  FaPlus,
  FaMinus,
  FaTimes,
} from "react-icons/fa";

const GenerationMenu = ({
  instruction,
  setInstruction,
  count,
  setCount,
  onGenerate,
  isLoading,
  isRegeneration = false,
  generationType = "paragraphs",
}) => {
  const [showInstruction, setShowInstruction] = useState(false);
  const handleClearInstruction = () => {
    setInstruction("");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Generate {isRegeneration ? "New " : ""}
          {generationType.charAt(0).toUpperCase() + generationType.slice(1)}
        </h3>
      </div> */}

      <div className="mb-4">
        <button
          onClick={() => setShowInstruction(!showInstruction)}
          className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors duration-200 flex items-center justify-between"
        >
          <span>{showInstruction ? "Hide" : "Add more instructions"} </span>
          {showInstruction ? <FaMinus /> : <FaPlus />}
        </button>
      </div>

      {showInstruction && (
        <div className="mb-4 relative">
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={`Enter specific instructions for ${generationType} generation (e.g., style, tone, focus)`}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
            rows="3"
          />
          {instruction && (
            <button
              onClick={handleClearInstruction}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Clear instruction"
            >
              <FaTimes />
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="countSlider"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Number of {generationType}: {count}
          </label>
          <input
            type="range"
            id="countSlider"
            min="1"
            max="10"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : isRegeneration ? (
            <FaRedo className="mr-2" />
          ) : (
            <FaMagic className="mr-2" />
          )}
          {isLoading
            ? "Generating..."
            : isRegeneration
            ? `Regenerate ${generationType}`
            : `Generate ${generationType}`}
        </button>
      </div>
    </div>
  );
};

export default GenerationMenu;
