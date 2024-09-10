import React, { useEffect, useState } from "react";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import SuggestableParagraph from "../../components/SuggestableParagraph";
import { useEbook } from "../../context/EbookContext";

const Synopsis = ({ chapter, chapterId, onEdit }) => {
  const { ebookState } = useEbook();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSynopsis, setEditedSynopsis] = useState(chapter.synopsis);

  useEffect(() => {
    setEditedSynopsis(chapter.synopsis);
  }, [chapter.synopsis]);

  const handleSave = () => {
    onEdit(editedSynopsis);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSynopsis(editedSynopsis);
    setIsEditing(false);
  };

  const handleChange = (suggestion) => {
    console.log(suggestion);
    setEditedSynopsis(suggestion);
  };

  const synopsisContext = {
    parameters: ebookState.parameters,
  };

  return (
    <div className="mb-6">
      <div className="bg-gray-100 p-4 rounded-md relative min-h-[100px]">
        {isEditing ? (
          <>
            <textarea
              className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] resize-y"
              value={editedSynopsis}
              onChange={(e) => setEditedSynopsis(e.target.value)}
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
            <SuggestableParagraph
              value={editedSynopsis}
              onChange={handleChange}
              fieldName="synopsis"
              context={synopsisContext}
            />
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
