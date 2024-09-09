import React, { useState, useRef } from "react";
import { FaLightbulb, FaUndo, FaTrash } from "react-icons/fa";
import SuggestableInput from "./SuggestableInput";
import { getSugggestedText } from "../server/ebook";

// Mock API function for character suggestions (replace with actual API call later)
const getCharacterSuggestions = async (context) => {
  let text = await getSugggestedText("character", "", context);
  console.log(text);
  return {
    name: text.name || "",
    age: text.age || "",
    occupation: text.occupation || "",
  };
};

const SuggestableCharacterField = ({
  character,
  context,
  onChange,
  onDelete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const previousCharacterRef = useRef(character);

  const handleSuggestAll = async () => {
    setIsLoading(true);
    try {
      const suggestions = await getCharacterSuggestions(context);
      previousCharacterRef.current = { ...character };
      onChange({ ...character, ...suggestions });
    } catch (error) {
      console.error("Error fetching character suggestions:", error);
    }
    setIsLoading(false);
  };

  const handleUndo = () => {
    onChange(previousCharacterRef.current);
  };

  const canUndo =
    JSON.stringify(previousCharacterRef.current) !== JSON.stringify(character);

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-medium text-gray-700">Character</h4>
        <div className="flex space-x-2">
          <button
            onClick={handleSuggestAll}
            disabled={isLoading}
            className="p-2 text-blue-500 hover:text-blue-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Suggest all character fields"
          >
            <FaLightbulb className="w-5 h-5" />
          </button>
          {canUndo && (
            <button
              onClick={handleUndo}
              className="p-2 text-gray-500 hover:text-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Undo character changes"
            >
              <FaUndo className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <FaTrash className="w-5 h-5" />
          </button>
        </div>
      </div>
      <SuggestableInput
        label="Name"
        value={character.name}
        onChange={(value) => onChange({ ...character, name: value })}
      />
      <SuggestableInput
        label="Age"
        value={character.age}
        onChange={(value) => onChange({ ...character, age: value })}
      />
      <SuggestableInput
        label="Occupation"
        value={character.occupation}
        onChange={(value) => onChange({ ...character, occupation: value })}
      />
    </div>
  );
};

export default SuggestableCharacterField;
