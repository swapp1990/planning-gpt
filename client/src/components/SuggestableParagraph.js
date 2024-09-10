import React, { useState, useRef } from "react";
import { FaLightbulb, FaUndo, FaSpinner } from "react-icons/fa";
import { getSugggestedText } from "../server/ebook";

// Mock function for getting suggestions (replace with actual API call later)
const getSuggestion = async (fieldName, context) => {
  let text = await getSugggestedText(fieldName, "", context);
  return text;
};

const SuggestableParagraph = ({ value, onChange, fieldName, context }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previousValue, setPreviousValue] = useState(value);

  const handleSuggest = async () => {
    setIsLoading(true);
    try {
      const suggestion = await getSuggestion(fieldName, context);
      console.log(suggestion);
      if (suggestion == previousValue) {
        console.log("suggested text is same as previous");
      } else {
        setPreviousValue(value);
        onChange(suggestion);
      }
    } catch (error) {
      console.error("Error fetching suggestion:", error);
    }
    setIsLoading(false);
  };

  const handleUndo = () => {
    onChange(previousValue);
  };

  return (
    <div className="relative group">
      <p className="text-gray-600 pr-10">{value}</p>
      <div className="absolute bottom-0 right-4 flex items-center space-x-2 opacity-100  transition-opacity">
        <button
          onClick={handleSuggest}
          disabled={isLoading}
          className="p-1 text-yellow-500 hover:text-yellow-600"
          aria-label="Suggest synopsis"
        >
          {isLoading ? (
            <FaSpinner className="w-5 h-5 animate-spin" />
          ) : (
            <FaLightbulb className="w-5 h-5" />
          )}
        </button>
        {value !== previousValue && (
          <button
            onClick={handleUndo}
            className="p-1 text-gray-500 hover:text-gray-600"
            aria-label="Undo"
          >
            <FaUndo className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SuggestableParagraph;
