import React, { useState } from "react";
import {
  FaOutdent,
  FaEdit,
  FaCheck,
  FaTimes,
  FaTrash,
  FaCheckCircle,
} from "react-icons/fa";

const OutlineSection = ({ outlines, onOutlineAction }) => {
  const [editingOutline, setEditingOutline] = useState(null);
  const [editedOutlineText, setEditedOutlineText] = useState("");
  const [paragraphCounts, setParagraphCounts] = useState({});

  const handleEdit = (outline) => {
    setEditingOutline(outline);
    setEditedOutlineText(outline.text);
  };

  const handleSave = () => {
    onOutlineAction("edit", editingOutline, editedOutlineText);
    setEditingOutline(null);
  };

  const handleCancel = () => {
    setEditingOutline(null);
  };

  const handleSubmit = (outline) => {
    const paragraphCount = paragraphCounts[outline.text] || 1;
    onOutlineAction("submit", outline, null, paragraphCount);
  };

  const handleParagraphCountChange = (outline, count) => {
    setParagraphCounts((prev) => ({ ...prev, [outline.text]: count }));
  };

  return (
    <div className="mt-4">
      {outlines.length > 0 ? (
        <div className="space-y-4">
          {outlines.map((outline, index) => (
            <div
              key={index}
              className={`p-3 rounded-md transition-colors duration-200 ${
                outline.status === "generated" ? "bg-green-50" : "bg-gray-100"
              }`}
            >
              {editingOutline === outline ? (
                <div className="flex flex-col space-y-2">
                  <textarea
                    value={editedOutlineText}
                    onChange={(e) => setEditedOutlineText(e.target.value)}
                    rows={2}
                    className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleSave}
                      className="p-2 text-green-600 hover:text-green-800"
                    >
                      <FaCheck />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-start">
                    {outline.status === "generated" ? (
                      <FaCheckCircle className="mr-2 mt-1 text-green-600 flex-shrink-0" />
                    ) : (
                      <FaOutdent className="mr-2 mt-1 text-gray-600 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        outline.status === "generated"
                          ? "text-green-800"
                          : "text-gray-800"
                      }`}
                    >
                      {outline.text}
                    </span>
                  </div>
                  {outline.status !== "generated" && (
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">
                        Paragraphs:
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={paragraphCounts[outline.text] || 1}
                        onChange={(e) =>
                          handleParagraphCountChange(
                            outline,
                            parseInt(e.target.value)
                          )
                        }
                        className="w-24 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-bold text-blue-600">
                        {paragraphCounts[outline.text] || 1}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between sm:justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(outline)}
                      className="p-2 text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleSubmit(outline)}
                      className={`p-2 ${
                        outline.status === "generated"
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-green-600 hover:text-green-800"
                      }`}
                      disabled={outline.status === "generated"}
                    >
                      <FaCheck />
                    </button>
                    <button
                      onClick={() => onOutlineAction("delete", outline)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">
          No outlines generated yet. Use the form above to generate outlines.
        </p>
      )}
    </div>
  );
};

export default OutlineSection;
