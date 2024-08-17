import React, { useEffect, useRef } from "react";

const InputPopup = ({
  position,
  visible,
  onClose,
  onSubmit,
  promptValue,
  setPromptValue,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  placeholder = "Enter your input...",
}) => {
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose(); // Close the popup if the click was outside
      }
    };

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="absolute bg-white p-4 rounded-lg shadow-lg"
      style={{
        top: position.y,
        left: position.x,
        transform: "translate(-50%, -100%)",
      }}
      ref={popupRef}
    >
      <input
        type="text"
        value={promptValue}
        onChange={(e) => setPromptValue(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg mb-2"
        placeholder={placeholder}
      />
      <button
        onClick={onSubmit}
        className="bg-blue-500 text-white p-2 rounded-lg mr-2"
      >
        {submitLabel}
      </button>
      <button
        onClick={onClose}
        className="bg-gray-500 text-white p-2 rounded-lg"
      >
        {cancelLabel}
      </button>
    </div>
  );
};

export default InputPopup;
