import React, { useState } from "react";
import {
  FaPen,
  FaTrash,
  FaCheck,
  FaTimes,
  FaPlus,
  FaShareAlt,
} from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import RewritePanel from "./RewritePanel";

const ParagraphMenu = ({
  content,
  chapterId,
  paragraphId,
  onClose,
  onCancel,
  onRewrite,
  onDelete,
  onInsert,
}) => {
  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const [isInsertOpen, setIsInsertOpen] = useState(false);
  const [insertContent, setInsertContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRewriteSubmit = async (instruction) => {
    setIsLoading(true);
    let response = await onRewrite(instruction);
    setIsLoading(false);
    return response;
  };

  const handleRewritCancel = async () => {
    setIsLoading(false);
    onCancel();
  };

  const handleInsertSubmit = async () => {
    setIsLoading(true);
    await onInsert(insertContent);
    setIsLoading(false);
    setIsInsertOpen(false);
    setInsertContent("");
  };

  return (
    <div className="bg-gray-100 p-2 rounded-b-lg border-t border-gray-200">
      <div className="flex space-x-2 mb-2">
        <button
          onClick={() => setIsRewriteOpen(!isRewriteOpen)}
          className={`p-2 hover:bg-gray-200 rounded-full transition-colors duration-200 ${
            isRewriteOpen ? "bg-blue-200" : ""
          }`}
          title="Rewrite"
        >
          <FaPen className="text-blue-500" />
        </button>
        <button
          onClick={() => setIsInsertOpen(!isInsertOpen)}
          className={`p-2 hover:bg-gray-200 rounded-full transition-colors duration-200 ${
            isInsertOpen ? "bg-green-200" : ""
          }`}
          title="Insert Paragraph"
        >
          <FaPlus className="text-green-500" />
        </button>
        <button
          onClick={() => onDelete(chapterId, paragraphId)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
          title="Delete"
        >
          <FaTrash className="text-red-500" />
        </button>
        <button
          className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
          title="Share"
        >
          <FaShareAlt className="text-purple-500" />
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
          title="Close"
        >
          &times;
        </button>
      </div>
      {isRewriteOpen && (
        <RewritePanel
          content={content}
          isLoading={isLoading}
          onSubmit={handleRewriteSubmit}
          onCancel={handleRewritCancel}
        />
      )}
      {isInsertOpen && (
        <div className="mt-2">
          <textarea
            className="w-full p-2 border rounded-md"
            rows="3"
            placeholder="Enter content for the new paragraph..."
            value={insertContent}
            onChange={(e) => setInsertContent(e.target.value)}
          />
          <div className="flex justify-end mt-2 space-x-2">
            <button
              onClick={() => setIsInsertOpen(false)}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleInsertSubmit}
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <AiOutlineLoading3Quarters className="animate-spin mr-2" />
              ) : (
                <FaCheck className="mr-1" />
              )}
              {isLoading ? "Adding..." : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParagraphMenu;
