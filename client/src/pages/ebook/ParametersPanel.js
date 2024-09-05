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

const ParametersPanel = ({ parameters, onParametersChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [localParameters, setLocalParameters] = useState(parameters);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalParameters(parameters);
  }, [parameters]);

  const handleInputChange = useCallback((key, value) => {
    setLocalParameters((prev) => {
      const newParams = { ...prev, [key]: value };
      setIsDirty(true);
      return newParams;
    });
  }, []);

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

  const handleSave = () => {
    onParametersChange(localParameters);
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleReset = () => {
    setLocalParameters(parameters);
    setIsDirty(false);
  };

  const toggleEdit = () => {
    if (isEditing && isDirty) {
      handleReset();
    }
    setIsEditing(!isEditing);
    setIsOpen(true);
  };

  const renderEditView = () => (
    <div className="space-y-6">
      <InputField
        label="Title"
        value={localParameters.title}
        onChange={(value) => handleInputChange("title", value)}
      />
      <InputField
        label="Genre"
        value={localParameters.genre}
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
      <InputField
        label="Premise"
        value={localParameters.premise}
        onChange={(value) => handleInputChange("premise", value)}
        multiline
      />
      <div>
        <h4 className="text-lg font-medium text-gray-700 mb-2">
          Main Characters
        </h4>
        {(localParameters.mainCharacters || []).map((character, index) => (
          <CharacterField
            key={index}
            character={character}
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
      <ArrayField
        label="Supporting Characters"
        items={localParameters.supportingCharacters || []}
        onChange={(value) => handleInputChange("supportingCharacters", value)}
        renderItem={(item, onChange) => (
          <div className="flex-grow grid grid-cols-2 gap-2">
            <InputField
              label="Name"
              value={item.name}
              onChange={(value) => onChange({ ...item, name: value })}
            />
            <InputField
              label="Role"
              value={item.role}
              onChange={(value) => onChange({ ...item, role: value })}
            />
          </div>
        )}
      />
      {/* Add more fields for plot, themes, and keyConflicts here */}
    </div>
  );

  const renderCompactView = () => (
    <div className="text-sm">
      <p>
        <strong>Title:</strong> {localParameters.title || "Not set"}
      </p>
      <p>
        <strong>Genre:</strong> {localParameters.genre || "Not set"}
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
        {localParameters.supportingCharacters?.length || 0}
      </p>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-4 transition-all duration-300 ease-in-out">
      <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
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
      {isOpen && (
        <div className="px-4 py-5 sm:p-6">
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
