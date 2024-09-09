import React, { useState, useEffect, useCallback } from "react";
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

import { useEbook } from "../../context/EbookContext";

import SuggestableInput from "../../components/SuggestableInput";
import SuggestableCharacterField from "../../components/SuggestableCharacter";

const InputField = React.memo(
  ({ label, value, onChange, multiline = false }) => {
    const inputProps = {
      className:
        "w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500",
      value: value || "",
      onChange: (e) => onChange(e.target.value),
    };

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {multiline ? (
          <textarea {...inputProps} rows={3} />
        ) : (
          <input type="text" {...inputProps} />
        )}
      </div>
    );
  }
);

const ArrayField = React.memo(({ label, items, onChange, renderItem }) => {
  const addItem = useCallback(() => {
    onChange([...items, ""]);
  }, [items, onChange]);

  const updateItem = useCallback(
    (index, value) => {
      const newItems = [...items];
      newItems[index] = value;
      onChange(newItems);
    },
    [items, onChange]
  );

  const removeItem = useCallback(
    (index) => {
      const newItems = items.filter((_, i) => i !== index);
      onChange(newItems);
    },
    [items, onChange]
  );

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {items.map((item, index) => (
        <div key={index} className="flex mb-2">
          {renderItem(item, (value) => updateItem(index, value))}
          <button
            onClick={() => removeItem(index)}
            className="ml-2 p-2 text-red-600 hover:bg-red-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <FaTrash />
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <FaPlus className="mr-2" /> Add {label}
      </button>
    </div>
  );
});

const CharacterField = React.memo(({ character, onChange, onDelete }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-medium text-gray-700">Character</h4>
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <FaTrash />
        </button>
      </div>
      <InputField
        label="Name"
        value={character.name}
        onChange={(value) => onChange({ ...character, name: value })}
      />
      <InputField
        label="Age"
        value={character.age}
        onChange={(value) => onChange({ ...character, age: value })}
      />
      <InputField
        label="Occupation"
        value={character.occupation}
        onChange={(value) => onChange({ ...character, occupation: value })}
      />
    </div>
  );
});

const ParametersPanel = () => {
  const { ebookState, ebookActions } = useEbook();
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [localParameters, setLocalParameters] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalParameters(ebookState.parameters);
  }, [ebookState.parameters]);

  const handleInputChange = (key, value) => {
    setLocalParameters((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleNestedChange = useCallback((parent, key, value) => {
    setLocalParameters((prev) => {
      const newParams = {
        ...prev,
        [parent]: { ...prev[parent], [key]: value },
      };
      setIsDirty(true);
      return newParams;
    });
  }, []);

  const handleMainCharactersChange = useCallback((newMainCharacters) => {
    setLocalParameters((prev) => {
      const newParams = { ...prev, mainCharacters: newMainCharacters };
      setIsDirty(true);
      return newParams;
    });
  }, []);

  const handleSupportingCharactersChange = useCallback((newCharacters) => {
    setLocalParameters((prev) => {
      const newParams = { ...prev, supportingCharacters: newCharacters };
      setIsDirty(true);
      return newParams;
    });
  }, []);

  const handleSave = () => {
    ebookActions.setParameters(localParameters);
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleReset = () => {
    setLocalParameters(ebookState.parameters);
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
        <strong>Title:</strong> {localParameters.title || "Not set"}
      </p>
      <p>
        <strong>Genre:</strong> {localParameters.genre || "Not set"}
      </p>
      <p>
        <strong>Premise:</strong> {localParameters.premise || "Not set"}
      </p>
      <p>
        <strong>Setting:</strong> {localParameters.setting?.place} (
        {localParameters.setting?.time})
      </p>
      <p>
        <p>
          <strong>Main Characters:</strong>{" "}
          {(localParameters.mainCharacters || [])
            .map((char) => char.name)
            .join(", ") || "None"}
        </p>
      </p>
      <p>
        <strong>Supporting Characters:</strong>{" "}
        {(localParameters.supportingCharacters || [])
          .map((char) => char.name)
          .join(", ") || "None"}
      </p>
    </div>
  );

  const renderEditView = () => (
    <div className="space-y-6">
      <SuggestableInput
        label="Title"
        value={localParameters.title}
        context={localParameters}
        onChange={(value) => handleInputChange("title", value)}
      />
      <SuggestableInput
        label="Genre"
        value={localParameters.genre}
        context={localParameters}
        onChange={(value) => handleInputChange("genre", value)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          label="Setting - Time"
          value={localParameters.setting?.time}
          onChange={(value) => handleNestedChange("setting", "time", value)}
        />
        <InputField
          label="Setting - Place"
          value={localParameters.setting?.place}
          onChange={(value) => handleNestedChange("setting", "place", value)}
        />
      </div>
      <SuggestableInput
        label="Premise"
        value={localParameters.premise}
        context={localParameters}
        onChange={(value) => handleInputChange("premise", value)}
        multiline
      />
      <div>
        <h4 className="text-lg font-medium text-gray-700 mb-2">
          Main Characters
        </h4>
        {(localParameters.mainCharacters || []).map((character, index) => (
          <SuggestableCharacterField
            key={index}
            character={character}
            context={localParameters}
            onChange={(updatedCharacter) => {
              const newMainCharacters = [...localParameters.mainCharacters];
              newMainCharacters[index] = updatedCharacter;
              handleMainCharactersChange(newMainCharacters);
            }}
            onDelete={() => {
              const newMainCharacters = localParameters.mainCharacters.filter(
                (_, i) => i !== index
              );
              handleMainCharactersChange(newMainCharacters);
            }}
          />
        ))}
        <button
          onClick={() => {
            const newMainCharacters = [
              ...(localParameters.mainCharacters || []),
              { name: "", age: "", occupation: "" },
            ];
            handleMainCharactersChange(newMainCharacters);
          }}
          className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <FaPlus className="mr-2" /> Add Main Character
        </button>
      </div>
      <div>
        <h4 className="text-lg font-medium text-gray-700 mb-2">
          Supporting Characters
        </h4>
        {(localParameters.supportingCharacters || []).map(
          (character, index) => (
            <SuggestableCharacterField
              key={index}
              character={character}
              context={localParameters}
              onChange={(updatedCharacter) => {
                const newCharacters = [...localParameters.supportingCharacters];
                newCharacters[index] = updatedCharacter;
                handleSupportingCharactersChange(newCharacters);
              }}
              onDelete={() => {
                const newCharacters =
                  localParameters.supportingCharacters.filter(
                    (_, i) => i !== index
                  );
                handleSupportingCharactersChange(newCharacters);
              }}
            />
          )
        )}
        <button
          onClick={() => {
            const newCharacters = [
              ...(localParameters.supportingCharacters || []),
              { name: "", age: "", occupation: "" },
            ];
            handleSupportingCharactersChange(newCharacters);
          }}
          className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <FaPlus className="mr-2" /> Add Supporting Character
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-lg mb-1 sm:mb-4">
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
