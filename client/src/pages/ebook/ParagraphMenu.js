import React, { useState, useCallback } from "react";
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
  paraInfo,
  onClose,
  onRewriteFinalize,
  onDelete,
  onInsertFinalize,
}) => {
  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const [isInsertOpen, setIsInsertOpen] = useState(false);

  const handleRewriteClick = () => {
    if (isRewriteOpen) {
      setIsRewriteOpen(false);
    } else {
      setIsRewriteOpen(true);
      setIsInsertOpen(false);
    }
  };

  const handleRewriteFinalize = async (newParagraphs) => {
    setIsRewriteOpen(false);
    await onRewriteFinalize(newParagraphs);
  };

  const handleInsertClick = () => {
    if (isInsertOpen) {
      setIsInsertOpen(false);
    } else {
      setIsInsertOpen(true);
      setIsRewriteOpen(false);
    }
  };

  const handleInsertFinalize = async (newParagraphs) => {
    setIsInsertOpen(false);
    await onInsertFinalize(newParagraphs);
  };

  const renderRewriteParagraphs = useCallback((sentences) => {
    let currentParagraph = [];
    const paragraphs = [];

    sentences.forEach((sentence, index) => {
      switch (sentence.action) {
        case "edit":
          currentParagraph.push(
            <React.Fragment key={index}>
              <span className="line-through text-gray-500">
                {sentence.original_sentence}
              </span>{" "}
              <span className="font-semibold bg-yellow-100">
                {sentence.rewritten_sentence}
              </span>{" "}
            </React.Fragment>
          );
          break;
        case "remove":
          currentParagraph.push(
            <span key={index} className="line-through text-red-500 bg-red-100">
              {sentence.original_sentence}{" "}
            </span>
          );
          break;
        case "add":
          currentParagraph.push(
            <span
              key={index}
              className="font-semibold text-green-700 bg-green-100"
            >
              {sentence.rewritten_sentence}{" "}
            </span>
          );
          break;
        case "paragraph_break":
          if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph);
            currentParagraph = [];
          }
          break;
        default:
          currentParagraph.push(
            <span key={index}>{sentence.original_sentence} </span>
          );
      }
    });

    // Add the last paragraph if it's not empty
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph);
    }

    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    );
  }, []);

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
          onClick={handleRewriteClick}
          className={`p-2 hover:bg-gray-200 rounded-full transition-colors duration-200 ${
            isRewriteOpen ? "bg-blue-200" : ""
          }`}
          title="Rewrite"
        >
          <FaPen className="text-blue-500" />
        </button>
        <button
          onClick={handleInsertClick}
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
          paraInfo={paraInfo}
          onFinalize={handleRewriteFinalize}
          onClose={() => setIsRewriteOpen(false)}
          renderContent={renderRewriteParagraphs}
          generationType="rewrite_paragraphs"
          title="Rewrite/Expand selected paragraph"
        />
      )}
      {isInsertOpen && (
        <ContentGenerator
          paraInfo={paraInfo}
          onFinalize={handleInsertFinalize}
          onClose={() => setIsRewriteOpen(false)}
          renderContent={renderParagraphs}
          generationType="insert_paragraphs"
          title="Insert after selected paragraph"
        />
      )}
    </div>
  );
};

export default ParagraphMenu;
