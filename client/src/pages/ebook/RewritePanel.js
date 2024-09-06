import React, { useState } from "react";
import { FaCheck, FaTimes, FaPen, FaPlus } from "react-icons/fa";

const NotePopover = ({ sentence, note, onSave, onCancel }) => {
  const [editedNote, setEditedNote] = useState(note);

  return (
    <div className="absolute top-0 right-0 transform -translate-y-full bg-white border rounded shadow-sm z-10">
      <input
        type="text"
        value={editedNote}
        onChange={(e) => setEditedNote(e.target.value)}
        placeholder="Add a note..."
        className="p-1 text-sm w-48"
        autoFocus
      />
      <button
        onClick={() => onSave(editedNote)}
        className="p-1 text-green-600 hover:text-green-800"
      >
        <FaCheck size={12} />
      </button>
      <button
        onClick={onCancel}
        className="p-1 text-red-500 hover:text-red-700"
      >
        <FaTimes size={12} />
      </button>
    </div>
  );
};

const SentenceSelector = ({
  content,
  selectedSentences,
  onSelectionChange,
}) => {
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];

  const handleSentenceClick = (index) => {
    if (selectedSentences[index]) {
      setEditingNoteIndex(index);
    } else {
      onSelectionChange(index, "");
      setEditingNoteIndex(index);
    }
  };

  const handleNoteSave = (index, note) => {
    onSelectionChange(index, note);
    setEditingNoteIndex(null);
  };

  const handleNoteCancel = (index) => {
    if (!selectedSentences[index]?.note) {
      onSelectionChange(index, null); // Remove selection if note is empty
    }
    setEditingNoteIndex(null);
  };

  return (
    <div className="mb-4">
      {sentences.map((sentence, index) => (
        <div key={index} className="relative group mb-2">
          <span
            className={`inline-block ${
              selectedSentences[index] ? "bg-yellow-200 rounded px-1" : ""
            }`}
            onClick={() => handleSentenceClick(index)}
          >
            {sentence}
            {selectedSentences[index] && (
              <span className="absolute top-0 right-0 transform -translate-y-full text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5">
                {selectedSentences[index].note || <FaPen size={8} />}
              </span>
            )}
          </span>
          {editingNoteIndex === index && (
            <NotePopover
              sentence={sentence}
              note={selectedSentences[index]?.note || ""}
              onSave={(note) => handleNoteSave(index, note)}
              onCancel={() => handleNoteCancel(index)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const RewritePanel = ({ content, isLoading, onSubmit, onCancel }) => {
  const [rewritePrompt, setRewritePrompt] = useState("");
  const [selectedSentences, setSelectedSentences] = useState({});
  const [showSentenceSelector, setShowSentenceSelector] = useState(false);

  const handleSelectionChange = (index, note) => {
    setSelectedSentences((prev) => {
      if (note === null) {
        const newSelected = { ...prev };
        delete newSelected[index];
        return newSelected;
      }
      return { ...prev, [index]: { note } };
    });
  };

  const handleSubmit = () => {
    const instructions = Object.entries(selectedSentences).map(
      ([index, { note }]) => `Sentence ${parseInt(index) + 1}: Note: ${note}`
    );
    const finalInstruction = `${rewritePrompt}\n\nSpecific instructions:\n${instructions.join(
      "\n"
    )}`;
    onSubmit(finalInstruction);
  };

  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Rewrite Section</h3>
      <button
        onClick={() => setShowSentenceSelector(!showSentenceSelector)}
        className="mb-2 px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
      >
        <FaPlus size={12} className="mr-1" />
        {showSentenceSelector ? "Hide Sentence Selector" : "Add Sentence Notes"}
      </button>
      {showSentenceSelector && (
        <SentenceSelector
          content={content}
          selectedSentences={selectedSentences}
          onSelectionChange={handleSelectionChange}
        />
      )}
      <div className="mb-2">
        {Object.entries(selectedSentences).map(([index, { note }]) => (
          <div key={index} className="text-sm text-gray-600 mb-1">
            Sentence {parseInt(index) + 1}: {note}
          </div>
        ))}
      </div>
      <textarea
        className="w-full p-2 border rounded-md mt-2"
        rows="3"
        placeholder="Enter general rewriting instructions here ..."
        value={rewritePrompt}
        onChange={(e) => setRewritePrompt(e.target.value)}
      />
      <div className="flex justify-end mt-2 space-x-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="animate-spin mr-2">&#9696;</span>
          ) : (
            <FaCheck size={16} className="mr-1" />
          )}
          {isLoading ? "Rewriting..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default RewritePanel;
