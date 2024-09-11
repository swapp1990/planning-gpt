import React, { useState, useCallback } from "react";
import { FaSync, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
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
    <div className="bg-blue-50 p-2 sm:p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-800 mb-4">Rewrite Mode</h2>
        <div className="bg-white p-4 rounded-md shadow">
          <label
            htmlFor="rewrite-instruction"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Rewrite Instruction
          </label>
          <textarea
            id="rewrite-instruction"
            rows="3"
            value={rewriteInstruction}
            onChange={(e) => setRewriteInstruction(e.target.value)}
            placeholder="Enter general rewrite instruction"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={handleCancelRewrite}
              className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center"
            >
              <FaTimes /> <span className="hidden sm:block ml-2">Cancel</span>
            </button>
            <button
              onClick={handleStartRewrite}
              disabled={
                currentRewritingParagraph !== -1 || !rewriteInstruction.trim()
              }
              className={`p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center ${
                currentRewritingParagraph !== -1 || !rewriteInstruction.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <FaEdit />{" "}
              <span className="hidden sm:block ml-2">Start Rewrite</span>
            </button>
            <button
              onClick={handleSubmitRewrite}
              disabled={currentRewritingParagraph !== -1}
              className={`p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center ${
                currentRewritingParagraph !== -1
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <FaCheck />{" "}
              <span className="hidden sm:block ml-2">Submit Rewrite</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {updatedContent.map((p, index) => (
          <div
            key={index}
            className={`transition-all duration-300 ${
              currentRewritingParagraph === index
                ? "bg-yellow-100 border-l-4 border-yellow-500 pl-4 shadow-md"
                : "bg-white"
            } p-0 sm:p-4 rounded-lg`}
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
    </div>
  );
};

export default RewriteMode;
