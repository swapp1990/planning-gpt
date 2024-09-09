import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaLightbulb, FaUndo } from "react-icons/fa";
import { getSugggestedText } from "../server/ebook";

// Mock API function (replace with actual API call later)
const getSuggestion = async (fieldName, context) => {
  let text = await getSugggestedText(fieldName, "", context);
  return text;
};

const SuggestableInput = ({
  label,
  value,
  context,
  onChange,
  multiline = false,
}) => {
  //   useEffect(() => {
  //     if (context) {
  //       console.log(context);
  //     }
  //   }, [context]);

  const [isLoading, setIsLoading] = useState(false);
  const previousValueRef = useRef(value);

  const handleSuggest = useCallback(async () => {
    setIsLoading(true);
    try {
      const suggestion = await getSuggestion(label, context);
      previousValueRef.current = value;
      onChange(suggestion);
    } catch (error) {
      console.error("Error fetching suggestion:", error);
    }
    setIsLoading(false);
  }, [label, value, context, onChange]);

  const handleUndo = () => {
    onChange(previousValueRef.current);
  };

  const InputComponent = multiline ? "textarea" : "input";

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <InputComponent
          className="w-full p-2 pr-20 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={multiline ? 3 : undefined}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <button
            onClick={handleSuggest}
            disabled={isLoading}
            className="p-1 text-blue-500 hover:text-blue-600 mr-1"
            aria-label={`Suggest ${label}`}
          >
            <FaLightbulb className="w-5 h-5" />
          </button>
          {previousValueRef.current !== value && (
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
    </div>
  );
};

export default SuggestableInput;
