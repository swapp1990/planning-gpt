import React, { useState, useCallback } from "react";
import { FaSync } from "react-icons/fa";
import RewriteParagraph from "./RewriteParagraph";

const RewriteMode = ({ content, onUpdateContent, onExitRewriteMode }) => {
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const [currentRewritingParagraph, setCurrentRewritingParagraph] =
    useState(-1);
  const [updatedContent, setUpdatedContent] = useState(content);

  const handleStartRewrite = useCallback(() => {
    setCurrentRewritingParagraph(0);
  }, []);

  const handleRewriteComplete = useCallback(() => {
    setCurrentRewritingParagraph((prev) => {
      if (prev + 1 < updatedContent.length) {
        return prev + 1;
      } else {
        return -1; // Rewriting all paragraphs is complete
      }
    });
  }, [updatedContent.length]);

  const handleUpdateParagraph = useCallback((index, newContent) => {
    setUpdatedContent((prev) => {
      const newUpdatedContent = [...prev];
      newUpdatedContent[index] = newContent;
      return newUpdatedContent;
    });
  }, []);

  const handleCancelRewrite = () => {
    onExitRewriteMode();
  };

  const handleSubmitRewrite = () => {
    onUpdateContent(updatedContent);
    onExitRewriteMode();
  };

  return (
    <div>
      <div className="mt-4">
        <input
          type="text"
          value={rewriteInstruction}
          onChange={(e) => setRewriteInstruction(e.target.value)}
          placeholder="Enter general rewrite instruction"
          className="w-full p-2 border rounded-md"
        />
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={handleCancelRewrite}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleStartRewrite}
            disabled={currentRewritingParagraph !== -1}
            className={`px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 ${
              currentRewritingParagraph !== -1
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            Start Rewrite
          </button>
          <button
            onClick={handleSubmitRewrite}
            disabled={currentRewritingParagraph !== -1}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 ${
              currentRewritingParagraph !== -1
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            Submit Rewrite
          </button>
        </div>
      </div>

      {updatedContent.map((p, index) => (
        <div
          key={index}
          className={`transition-all duration-300 ${
            currentRewritingParagraph === index
              ? "bg-yellow-100 border-l-4 border-yellow-500 pl-4 shadow-md"
              : ""
          }`}
        >
          <RewriteParagraph
            content={p}
            index={index}
            instruction={rewriteInstruction}
            onRewriteComplete={handleRewriteComplete}
            isRewriting={currentRewritingParagraph === index}
            onUpdateParagraph={handleUpdateParagraph}
          />
          {currentRewritingParagraph === index && (
            <div className="text-sm text-yellow-600 mt-2 flex items-center">
              <FaSync className="animate-spin mr-2" />
              Currently rewriting this paragraph...
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RewriteMode;
