import React, { useState } from "react";

const SelectableSentence = ({ sentence, index, onNoteChange }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [note, setNote] = useState("");

  const handleClick = () => {
    setIsSelected(!isSelected);
  };

  const handleNoteChange = (e) => {
    const newNote = e.target.value;
    setNote(newNote);
    onNoteChange(index, newNote);
  };

  return (
    <span className="relative">
      <span
        onClick={handleClick}
        className={`cursor-pointer ${isSelected ? "bg-yellow-200" : ""}`}
      >
        {sentence}
      </span>
      {isSelected && (
        <input
          type="text"
          value={note}
          onChange={handleNoteChange}
          placeholder="Add note"
          className="absolute left-0 top-full mt-1 p-1 border rounded-md text-sm w-full"
        />
      )}
    </span>
  );
};

export default SelectableSentence;
