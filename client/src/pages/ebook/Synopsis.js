import React, { useState } from "react";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";

const Synopsis = ({ synopsis, chapterId, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSynopsis, setEditedSynopsis] = useState(synopsis);

  const handleSave = () => {
    onEdit(editedSynopsis);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSynopsis(synopsis);
    setIsEditing(false);
  };

  return (
    <div className="mb-6">
      <div className="bg-gray-100 p-4 rounded-md min-h-24 relative">
        {isEditing ? (
          <>
            <textarea
              className="w-full h-full p-2 text-gray-600 bg-white border rounded"
              value={editedSynopsis}
              onChange={(e) => setEditedSynopsis(e.target.value)}
              rows={3}
            />
            <div className="mt-2 flex justify-end space-x-2">
              <button
                onClick={handleSave}
                className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <FaCheck />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <FaTimes />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-600 pr-2">{synopsis}</p>
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-2 right-2 p-2 text-blue-500 hover:text-blue-600"
            >
              <FaEdit />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Synopsis;
