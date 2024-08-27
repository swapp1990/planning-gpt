import { useState } from "react";
import { FaPen, FaCopy, FaTrash, FaShareAlt, FaCheck } from "react-icons/fa";

const ParagraphMenu = ({
  onClose,
  onRewrite,
  isRewriteOpen,
  setIsRewriteOpen,
}) => {
  const [rewritePrompt, setRewritePrompt] = useState("");
  const handleRewriteClick = () => {
    setIsRewriteOpen(!isRewriteOpen);
  };

  const handleSubmitRewrite = () => {
    onRewrite(rewritePrompt);
    setIsRewriteOpen(false);
    setRewritePrompt("");
  };

  const handleCancelRewrite = () => {
    setIsRewriteOpen(false);
    setRewritePrompt("");
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
          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          title="Copy"
        >
          <FaCopy className="text-green-500" />
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
              onClick={handleCancelRewrite}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRewrite}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
            >
              <FaCheck size={16} className="mr-1" />
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Paragraph = ({
  content,
  onSelect,
  isSelected,
  isRewriteOpen,
  setIsRewriteOpen,
  onRewrite,
  onCloseMenu,
  chapterId,
  paragraphIndex,
}) => {
  return (
    <div className={`mb-4 ${isSelected ? "bg-blue-50 rounded-t-lg" : ""}`}>
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
          isRewriteOpen={isRewriteOpen}
          setIsRewriteOpen={setIsRewriteOpen}
        />
      )}
    </div>
  );
};

export default Paragraph;
