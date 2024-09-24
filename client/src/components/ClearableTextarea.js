import React, { useState, useEffect } from "react";
import { FaTimes, FaUndo } from "react-icons/fa";

const ClearableTextarea = ({
  value,
  onChange,
  onClear,
  placeholder,
  rows = 3,
  className = "",
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [previousValue, setPreviousValue] = useState("");
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => {
    if (value !== "" && value !== previousValue) {
      setPreviousValue(value);
    }
  }, [value]);

  const handleClear = () => {
    setPreviousValue(value);
    onChange("");
    setShowUndo(true);
    onClear && onClear();
  };

  const handleUndo = () => {
    onChange(previousValue);
    setShowUndo(false);
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    if (showUndo) {
      setShowUndo(false);
    }
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => {
          e.stopPropagation();
          handleChange(e);
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onFocus={(e) => {
          e.stopPropagation();
          setIsFocused(true);
        }}
        onBlur={(e) => {
          e.stopPropagation();
          setIsFocused(false);
        }}
        placeholder={placeholder}
        className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${className}`}
        rows={rows}
        {...props}
      />
      {value && (isFocused || value) && (
        <button
          onClick={handleClear}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          aria-label="Clear text"
        >
          <FaTimes />
        </button>
      )}
      {showUndo && (
        <button
          onClick={handleUndo}
          className="absolute bottom-2 right-2 text-blue-500 hover:text-blue-600 transition-colors duration-200"
          aria-label="Undo clear"
        >
          <FaUndo />
        </button>
      )}
    </div>
  );
};

export default ClearableTextarea;
