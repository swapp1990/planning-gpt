import React, { useState, useEffect } from "react";
import {
  FaCog,
  FaChevronDown,
  FaChevronUp,
  FaPlus,
  FaTrash,
  FaSave,
  FaUndo,
  FaEdit,
} from "react-icons/fa";

const ParametersPanel = ({ parameters, onParametersChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localParameters, setLocalParameters] = useState(parameters);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalParameters(parameters);
  }, [parameters]);

  const handleInputChange = (key, value) => {
    setLocalParameters((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleCharacterChange = (index, field, value) => {
    const updatedCharacters = [...(localParameters.characters || [])];
    updatedCharacters[index] = { ...updatedCharacters[index], [field]: value };
    setLocalParameters((prev) => ({ ...prev, characters: updatedCharacters }));
    setIsDirty(true);
  };

  const addCharacter = () => {
    const newCharacter = { name: "", description: "", role: "" };
    setLocalParameters((prev) => ({
      ...prev,
      characters: [...(prev.characters || []), newCharacter],
    }));
    setIsDirty(true);
  };

  const removeCharacter = (index) => {
    const updatedCharacters = (localParameters.characters || []).filter(
      (_, i) => i !== index
    );
    setLocalParameters((prev) => ({ ...prev, characters: updatedCharacters }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onParametersChange(localParameters);
    setIsDirty(false);
  };

  const handleReset = () => {
    setLocalParameters(parameters);
    setIsDirty(false);
  };

  const toggleEdit = () => {
    if (!isEditing) {
      setIsOpen(true);
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
    if (isEditing && isDirty) {
      handleReset();
    }
  };

  const renderCompactView = () => (
    <div className="text-sm">
      <p>
        <strong>Summary:</strong> {localParameters.summary || "Not set"}
      </p>
      <p>
        <strong>Theme:</strong> {localParameters.theme || "Not set"}
      </p>
      <p>
        <strong>Genre:</strong> {localParameters.genre || "Not set"}
      </p>
      <p>
        <strong>Characters:</strong> {(localParameters.characters || []).length}
      </p>
    </div>
  );

  const renderEditView = () => (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="summary"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Summary
        </label>
        <textarea
          id="summary"
          rows={3}
          className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter book summary..."
          value={localParameters.summary || ""}
          onChange={(e) => handleInputChange("summary", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="theme"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Theme
          </label>
          <input
            type="text"
            id="theme"
            className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter book theme..."
            value={localParameters.theme || ""}
            onChange={(e) => handleInputChange("theme", e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="genre"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Genre
          </label>
          <input
            type="text"
            id="genre"
            className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter book genre..."
            value={localParameters.genre || ""}
            onChange={(e) => handleInputChange("genre", e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Characters
        </label>
        <div className="space-y-4">
          {(localParameters.characters || []).map((character, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Character {index + 1}
                </h4>
                <button
                  onClick={() => removeCharacter(index)}
                  className="inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  <FaTrash />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={character.name || ""}
                  onChange={(e) =>
                    handleCharacterChange(index, "name", e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="Age"
                  className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={character.role || ""}
                  onChange={(e) =>
                    handleCharacterChange(index, "role", e.target.value)
                  }
                />
                <textarea
                  placeholder="Description"
                  rows={2}
                  className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={character.description || ""}
                  onChange={(e) =>
                    handleCharacterChange(index, "description", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addCharacter}
          className="mt-4 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
        >
          <FaPlus className="mr-2" /> Add Character
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-lg mb-4">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between flex-wrap sm:flex-nowrap">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Book Parameters
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleEdit}
              className={`inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                isEditing
                  ? "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              }`}
            >
              <FaEdit className="mr-2" /> {isEditing ? "View" : "Edit"}
            </button>
            <button
              className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              onClick={() => setIsOpen(!isOpen)}
            >
              <FaCog className="mr-2" />
              {isOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="px-4 py-2 sm:p-2">
          {isEditing ? renderEditView() : renderCompactView()}
          {isEditing && (
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleReset}
                disabled={!isDirty}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaUndo className="inline-block mr-2" /> Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave className="inline-block mr-2" /> Save Changes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParametersPanel;
