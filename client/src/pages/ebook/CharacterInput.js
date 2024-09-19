// src/components/CharacterInput.js
import React from "react";
import { FaUser, FaCamera } from "react-icons/fa";
import SuggestableCharacterField from "../../components/SuggestableCharacter";

const CharacterInput = ({
  character,
  onChange,
  onDelete,
  isMainCharacter,
  context,
}) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FaUser className="text-blue-500 mr-2 text-xl" />
          <h3 className="text-lg font-semibold text-gray-700">
            {isMainCharacter ? "Main Character" : "Supporting Character"}
          </h3>
        </div>
      </div>
      <SuggestableCharacterField
        character={character}
        context={context}
        onChange={onChange}
        onDelete={onDelete}
      />
      {isMainCharacter && (
        <div className="mt-4">
          <div className="flex items-center mb-2">
            <FaCamera className="text-blue-500 mr-2" />
            <span className="font-semibold text-gray-700">Character Photo</span>
          </div>
          <div className="bg-gray-200 p-4 rounded-lg text-center cursor-pointer hover:bg-gray-300 transition duration-200">
            <p className="text-gray-600">Photo generation coming soon!</p>
            <p className="text-sm text-gray-500 mt-1">
              Click to generate (feature not yet available)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterInput;
