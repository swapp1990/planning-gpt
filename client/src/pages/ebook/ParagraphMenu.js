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
import ContentGenerator from "./ContentGenerator";

const ParagraphMenu = ({
  content,
  chapterId,
  paragraphId,
  onClose,
  onCancel,
  onRewrite,
  onRewriteFinalize,
  onDelete,
  onInsert,
  onInsertFinalize,
}) => {
  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const [isInsertOpen, setIsInsertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRewriteSubmit = async (instruction, numParagraphs) => {
    setIsLoading(true);
    let response = await onRewrite(instruction, numParagraphs);
    setIsLoading(false);
    return response;
  };

  const handleRewriteFinalize = async (newParagraphs) => {
    setIsRewriteOpen(false);
    await onRewriteFinalize(newParagraphs);
  };

  const handleInsertSubmit = async (instruction, numParagraphs) => {
    setIsLoading(true);
    let response = await onInsert(instruction, numParagraphs);
    setIsLoading(false);
    return response;
  };

  const handleInsertFinalize = async (newParagraphs) => {
    setIsInsertOpen(false);
    await onInsertFinalize(newParagraphs);
  };

  const renderParagraphs = (paragraphs) => {
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="mb-2">
        {paragraph}
      </p>
    ));
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
        <ContentGenerator
          initialContent={content}
          onGenerate={handleRewriteSubmit}
          onFinalize={handleRewriteFinalize}
          onClose={() => setIsRewriteOpen(false)}
          renderContent={renderParagraphs}
          generationType="paragraphs"
          title="Rewrite/Expand selected paragraph"
        />
      )}
      {isInsertOpen && (
        <ContentGenerator
          initialContent={content}
          onGenerate={handleInsertSubmit}
          onFinalize={handleInsertFinalize}
          onClose={() => setIsRewriteOpen(false)}
          renderContent={renderParagraphs}
          generationType="paragraphs"
          title="Insert after selected paragraph"
        />
      )}
    </div>
  );
};

export default ParagraphMenu;
