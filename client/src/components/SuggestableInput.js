import React, { useState, useRef, useCallback } from "react";
import { FaLightbulb, FaUndo } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { getSugggestedText } from "../server/ebook";

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
      <div
        className={`relative flex ${
          multiline ? "items-start" : "items-center"
        }`}
      >
        <div
          className={`flex ${
            multiline ? "flex-col space-y-2" : "space-x-2"
          } mr-2`}
        >
          <button
            onClick={handleSuggest}
            disabled={isLoading}
            className="p-1 text-yellow-500 hover:text-yellow-600"
            aria-label={isLoading ? "Loading suggestion" : `Suggest ${label}`}
          >
            {isLoading ? (
              <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
            ) : (
              <FaLightbulb className="w-5 h-5" />
            )}
          </button>
          {previousValueRef.current !== value && (
            <button
              onClick={handleUndo}
              className="p-1 text-yellow-500 hover:text-yellow-600"
              aria-label="Undo"
            >
              <FaUndo className="w-5 h-5" />
            </button>
          )}
        </div>
        <InputComponent
          className={`w-full p-2 border rounded-md focus:ring-yellow-500 focus:border-yellow-500 ${
            multiline ? "sm:pl-10 pl-2" : "pl-4 sm:pl-8"
          }`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={multiline ? 3 : undefined}
        />
      </div>
    </div>
  );
};

export default SuggestableInput;
