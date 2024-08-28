import React, { useState } from "react";
import { FaPen, FaPlus, FaTrash, FaShareAlt, FaCheck } from "react-icons/fa";

const ParagraphMenu = ({ onClose, onRewrite, onContParagraph }) => {
  const [rewritePrompt, setRewritePrompt] = React.useState("");
  const [contParagraphPrompt, setContParagraphPrompt] = useState("");
  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const [isContParagraphOpen, setIsContParagraphOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRewriteClick = () => {
    setIsRewriteOpen(!isRewriteOpen);
    setIsContParagraphOpen(false);
  };

  const handleContParagraphClick = () => {
    setIsContParagraphOpen(!isContParagraphOpen);
    setIsRewriteOpen(false);
  };

  const handleSubmitRewrite = async () => {
    setIsLoading(true);
    let response = await onRewrite(rewritePrompt);
    if (response.newParagraph) {
      setIsRewriteOpen(false);
      setRewritePrompt("");
      setIsLoading(false);
    } else {
      setError("An error occurred. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleSubmitContParagraph = async () => {
    setIsLoading(true);
    let response = await onContParagraph(contParagraphPrompt);
    if (response.newParagraph) {
      setIsContParagraphOpen(false);
      setContParagraphPrompt("");
      setIsLoading(false);
    } else {
      setError("An error occurred. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsRewriteOpen(false);
    setIsContParagraphOpen(false);
    setRewritePrompt("");
    setContParagraphPrompt("");
  };

  return (
    <div className="bg-gray-100 p-2 rounded-b-lg border-t border-gray-200">
      <div className="flex space-x-2 mb-2">
        <button
          onClick={handleRewriteClick}
          className={`p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 ${
            isRewriteOpen ? "bg-blue-100" : ""
          }`}
          title="Rewrite"
        >
          <FaPen className="text-blue-500" />
        </button>
        <button
          onClick={handleContParagraphClick}
          className={`p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 ${
            isContParagraphOpen ? "bg-green-100" : ""
          }`}
          title="Continue Paragraph"
        >
          <FaPlus className="text-green-500" />
        </button>
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          title="Delete"
        >
          <FaTrash className="text-red-500" />
        </button>
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          title="Share"
        >
          <FaShareAlt className="text-purple-500" />
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          title="Close"
        >
          &times;
        </button>
      </div>
      {isRewriteOpen && (
        <div className="mt-2">
          <textarea
            className="w-full p-2 border rounded-md"
            rows="3"
            placeholder="Enter your rewrite prompt..."
            value={rewritePrompt}
            onChange={(e) => setRewritePrompt(e.target.value)}
          />
          <div className="flex justify-end mt-2 space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRewrite}
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
      )}
      {isContParagraphOpen && (
        <div className="mt-2">
          <textarea
            className="w-full p-2 border rounded-md"
            rows="3"
            placeholder="Enter content for the new paragraph..."
            value={contParagraphPrompt}
            onChange={(e) => setContParagraphPrompt(e.target.value)}
          />
          <div className="flex justify-end mt-2 space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitContParagraph}
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-spin mr-2">&#9696;</span>
              ) : (
                <FaCheck size={16} className="mr-1" />
              )}
              {isLoading ? "Adding..." : "Submit"}
            </button>
          </div>
        </div>
      )}
      {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
    </div>
  );
};

const Paragraph = ({
  content,
  onSelect,
  isSelected,
  onRewrite,
  onInsertParagraph,
  onCloseMenu,
  chapterId,
  paragraphIndex,
}) => {
  return (
    <div className={`mb-0 ${isSelected ? "bg-blue-50 rounded-t-lg" : ""}`}>
      <p
        className={`p-2 rounded-t-lg transition-colors duration-200 hover:bg-gray-100 cursor-pointer`}
        onClick={() => onSelect(chapterId, paragraphIndex)}
      >
        {content}
      </p>
      {isSelected && (
        <ParagraphMenu
          onClose={() => onCloseMenu(chapterId)}
          onRewrite={(prompt) => onRewrite(chapterId, paragraphIndex, prompt)}
          onContParagraph={(prompt) =>
            onInsertParagraph(chapterId, paragraphIndex, prompt)
          }
        />
      )}
    </div>
  );
};

export default Paragraph;
