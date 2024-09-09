import React, { useState } from "react";
import { FaPen, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const Paragraph = ({ content, index, chapterId, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    await onEdit(index, editedContent);
    setIsEditing(false);
    setIsLoading(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleDeleteClick = async () => {
    setIsLoading(true);
    await onDelete(index);
    setIsLoading(false);
  };

  return (
    <div className={`mb-4 ${isMenuOpen ? "bg-blue-50 rounded-lg" : ""}`}>
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            className="w-full p-2 border rounded"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
              disabled={isLoading}
            >
              <FaTimes className="mr-1" /> Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <AiOutlineLoading3Quarters className="animate-spin mr-2" />
              ) : (
                <FaCheck className="mr-1" />
              )}
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              //   handleParagraphSelect(chapterId, index);
              setIsMenuOpen(!isMenuOpen);
            }}
          >
            {content}
          </p>
          {isMenuOpen && (
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={handleEditClick}
                className="p-2 text-blue-500 hover:bg-blue-100 rounded-full transition-colors duration-200"
                title="Edit"
              >
                <FaPen />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors duration-200"
                title="Delete"
                disabled={isLoading}
              >
                {isLoading ? (
                  <AiOutlineLoading3Quarters className="animate-spin" />
                ) : (
                  <FaTrash />
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Paragraph;
