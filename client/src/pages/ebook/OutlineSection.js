import React, { useState } from "react";
import {
  FaOutdent,
  FaEdit,
  FaCheck,
  FaTimes,
  FaTrash,
  FaRedo,
  FaCheckCircle,
} from "react-icons/fa";

const ParagraphModal = ({ isOpen, onClose, onConfirm }) => {
  const [paragraphCount, setParagraphCount] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4">Generate Paragraphs</h3>
        <div className="mb-4">
          <label
            htmlFor="paragraphCount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Number of paragraphs: {paragraphCount}
          </label>
          <input
            type="range"
            id="paragraphCount"
            min="1"
            max="10"
            value={paragraphCount}
            onChange={(e) => setParagraphCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(paragraphCount)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

const OutlineSection = ({ outlines, onOutlineAction }) => {
  const [editingOutline, setEditingOutline] = useState(null);
  const [editedOutlineText, setEditedOutlineText] = useState("");
  const [selectedOutline, setSelectedOutline] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleSubmitClick = (outline) => {
    setSelectedOutline(outline);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedOutline(null);
  };

  const handleModalConfirm = (paragraphCount) => {
    onOutlineAction("submit", selectedOutline, null, paragraphCount);
    setIsModalOpen(false);
    setSelectedOutline(null);
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
                  <div className="flex justify-between sm:justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(outline)}
                      className="p-2 text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleSubmitClick(outline)}
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
                    <button
                      onClick={() => onOutlineAction("reload", outline)}
                      className="p-2 text-yellow-600 hover:text-yellow-800"
                    >
                      <FaRedo />
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
      <ParagraphModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};

export default OutlineSection;
