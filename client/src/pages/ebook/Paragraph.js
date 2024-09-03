import React, { useState } from "react";
import {
  FaPen,
  FaPlus,
  FaTrash,
  FaShareAlt,
  FaCheck,
  FaTimes,
  FaUndo,
  FaEye,
  FaExclamationCircle,
} from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { computeDiff } from "../../utils/paragraphDiff";
import { useBook } from "./BookContext";
import RewritePanel from "./RewritePanel";

const ParagraphReview = ({ original, edited, onSave, onCancel }) => {
  const [changes, setChanges] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    init();
  }, [original, edited]);

  async function init() {
    // const rewritten = await mockAIRewrite(content, "TEST");
    // setEditedParagraph(rewritten);
    setChanges(computeDiff(original, edited));
  }

  const mockAIRewrite = async (text, prompt) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const sentences = text.split(/(?<=[.!?])\s+/);
    return sentences
      .map((sentence, index) => {
        const rand = Math.random();
        if (rand < 0.2) return sentence;
        if (rand < 0.4)
          return (
            sentence +
            " " +
            [prompt, "Here's more context.", "Consider this point as well."][
              Math.floor(Math.random() * 3)
            ]
          );
        if (rand < 0.6) return "";
        if (rand < 0.8)
          return (
            "This sentence has been completely rewritten based on the prompt: " +
            prompt +
            ". " +
            sentence
          );
        return sentence;
      })
      .filter(Boolean)
      .join(" ");
  };

  const toggleChange = (index, status) => {
    setChanges(
      changes.map((change, i) =>
        i === index
          ? {
              ...change,
              status: status,
            }
          : change
      )
    );
    setError(null);
  };

  const applyChanges = () => {
    if (changes.some((change) => change.status === "pending")) {
      setError("Please accept or reject all changes before applying.");
      return;
    }

    const newParagraph = changes
      .map((change) => {
        switch (change.type) {
          case "addition":
            return change.status === "accepted" ? change.content : "";
          case "deletion":
            return change.status === "rejected" ? change.content : "";
          case "modification":
            return change.status === "accepted"
              ? change.modified
              : change.original;
          default:
            return change.content;
        }
      })
      .filter(Boolean)
      .join(" ");

    onSave(newParagraph);
  };

  const renderInlineDiff = () => {
    return (
      <div className="space-y-2">
        {changes.map((change, index) => {
          const isApplied =
            change.status === "accepted" || change.status === "rejected";

          const renderActionButtons = () => (
            <div className="flex space-x-1">
              <button
                onClick={() => toggleChange(index, "accepted")}
                className={`p-1 rounded hover:bg-gray-200 ${
                  change.status === "accepted" ? "bg-green-200" : ""
                }`}
                title="Accept"
              >
                <FaCheck size={16} className="text-green-500" />
              </button>
              <button
                onClick={() => toggleChange(index, "rejected")}
                className={`p-1 rounded hover:bg-gray-200 ${
                  change.status === "rejected" ? "bg-red-200" : ""
                }`}
                title="Reject"
              >
                <FaTimes size={16} className="text-red-500" />
              </button>
              {/* {isApplied && (
                <button
                  onClick={() => toggleChange(index, "pending")}
                  className="p-1 rounded hover:bg-gray-200"
                  title="Revert"
                >
                  <FaUndo size={16} className="text-blue-500" />
                </button>
              )} */}
            </div>
          );

          const renderAppliedIndicator = () => (
            <span className="ml-2 text-sm text-gray-500 flex items-center">
              <FaExclamationCircle size={12} className="mr-1" />
              Applied
            </span>
          );

          switch (change.type) {
            case "addition":
              return (
                <div key={index} className="flex items-center space-x-2">
                  <span
                    className={`py-1 px-2 rounded ${
                      change.status === "accepted"
                        ? "bg-green-100 border-l-4 border-green-500"
                        : change.status === "rejected"
                        ? "bg-red-100 border-l-4 border-red-500"
                        : "bg-yellow-100 border-l-4 border-yellow-500"
                    }`}
                  >
                    {change.content}
                  </span>
                  {renderActionButtons()}
                  {/* {isApplied && renderAppliedIndicator()} */}
                </div>
              );
            case "deletion":
              return (
                <div key={index} className="flex items-center space-x-2">
                  <span
                    className={`py-1 px-2 rounded ${
                      change.status === "accepted"
                        ? "line-through text-gray-500"
                        : change.status === "rejected"
                        ? ""
                        : "line-through bg-yellow-100 border-l-4 border-yellow-500"
                    }`}
                  >
                    {change.content}
                  </span>
                  {renderActionButtons()}
                  {/* {isApplied && renderAppliedIndicator()} */}
                </div>
              );
            case "modification":
              return (
                <div key={index} className="flex items-center space-x-2">
                  <span
                    className={`py-1 px-2 rounded ${
                      change.status !== "rejected"
                        ? "line-through text-gray-500"
                        : ""
                    }`}
                  >
                    {change.original}
                  </span>
                  {change.status !== "rejected" && (
                    <span
                      className={`py-1 px-2 rounded ${
                        change.status === "accepted"
                          ? "bg-green-100 border-l-4 border-green-500"
                          : "bg-yellow-100 border-l-4 border-yellow-500"
                      }`}
                    >
                      {change.modified}
                    </span>
                  )}
                  {renderActionButtons()}
                  {/* {isApplied && renderAppliedIndicator()} */}
                </div>
              );
            default:
              return <span key={index}>{change.content} </span>;
          }
        })}
      </div>
    );
  };

  const renderPreview = () => {
    const previewText = changes
      .map((change) => {
        switch (change.type) {
          case "addition":
            return change.status === "accepted" ? change.content : "";
          case "deletion":
            return change.status === "rejected" ? change.content : "";
          case "modification":
            return change.status === "accepted"
              ? change.modified
              : change.original;
          default:
            return change.content;
        }
      })
      .filter(Boolean)
      .join(" ");

    return (
      <div className="p-4 border rounded bg-white">
        <p>{previewText}</p>
      </div>
    );
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <p className="font-semibold">Review Changes</p>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
        >
          <FaEye className="mr-2" size={16} />
        </button>
      </div>
      {showPreview ? renderPreview() : renderInlineDiff()}
      <div className="flex flex-col items-center space-x-2">
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={applyChanges}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Apply Changes
          </button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
};

const ParagraphMenu = ({ content, chapterId, paragraphId, onClose }) => {
  const {
    handleDeleteParagraph,
    handleRewriteParagraph,
    handleInsertParagraph,
    handleReviewApply,
  } = useBook();
  const [rewritePrompt, setRewritePrompt] = React.useState("");
  const [rewriteResponse, setRewriteResponse] = React.useState(null);
  const [insertParaPrompt, setInsertParaPrompt] = useState("");
  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const [isInsertParaOpen, setisInsertParaOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRewriteReviewOpen, setIsRewriteReviewOpen] = useState(false);

  const handleRewriteClick = () => {
    setIsRewriteOpen(!isRewriteOpen);
    setisInsertParaOpen(false);
  };

  const onInsertParaClick = () => {
    setisInsertParaOpen(!isInsertParaOpen);
    setIsRewriteOpen(false);
  };

  const handleSubmitRewrite = async (finalInstruction) => {
    setIsLoading(true);
    let response = await handleRewriteParagraph(
      chapterId,
      paragraphId,
      finalInstruction
    );
    if (response.newParagraph) {
      setIsRewriteOpen(false);
      setRewritePrompt("");
      setIsLoading(false);
      setRewriteResponse(response.newParagraph);
      setIsRewriteReviewOpen(true);
      setError(null);
    } else {
      setError("An error occurred. Please try again later.");
      setIsLoading(false);
    }
  };

  const onRewriteCancel = () => {
    setIsLoading(false);
    setIsRewriteOpen(false);
    setRewritePrompt("");
    setRewriteResponse("");
    setError(null);
    setIsRewriteReviewOpen(false);
  };

  const onInsertParaSubmit = async () => {
    setIsLoading(true);
    let response = await handleInsertParagraph(
      chapterId,
      paragraphId,
      insertParaPrompt
    );
    if (response.newParagraph) {
      setisInsertParaOpen(false);
      setInsertParaPrompt("");
      setIsLoading(false);
    } else {
      setError("An error occurred. Please try again later.");
      setIsLoading(false);
    }
  };

  const onInsertParaCancel = () => {
    setIsRewriteOpen(false);
    setisInsertParaOpen(false);
    setRewritePrompt("");
    setInsertParaPrompt("");
  };

  const onDeleteParagraph = () => {
    handleDeleteParagraph(chapterId, paragraphId);
  };

  const onReviewSave = (newParagraph) => {
    setIsRewriteReviewOpen(false);
    handleReviewApply(chapterId, paragraphId, newParagraph);
  };

  const onReviewCancel = () => {
    setIsRewriteReviewOpen(false);
  };

  return (
    <div className="bg-gray-100 p-2 rounded-b-lg border-t border-gray-200">
      <div className="flex space-x-2 mb-2">
        <button
          onClick={handleRewriteClick}
          className={`p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 ${
            isRewriteOpen || isRewriteReviewOpen ? "bg-blue-200" : ""
          }`}
          title="Rewrite"
        >
          <FaPen className="text-blue-500" />
        </button>
        <button
          onClick={onInsertParaClick}
          className={`p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 ${
            isInsertParaOpen ? "bg-green-100" : ""
          }`}
          title="Continue Paragraph"
        >
          <FaPlus className="text-green-500" />
        </button>
        <button
          onClick={onDeleteParagraph}
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
        <RewritePanel
          content={content}
          onSubmit={handleSubmitRewrite}
          onCancel={onRewriteCancel}
        />
      )}
      {isRewriteReviewOpen && (
        <ParagraphReview
          original={content}
          edited={rewriteResponse}
          onSave={onReviewSave}
          onCancel={onReviewCancel}
        />
      )}
      {isInsertParaOpen && (
        <div className="mt-2">
          <textarea
            className="w-full p-2 border rounded-md"
            rows="3"
            placeholder="Enter content for the new paragraph..."
            value={insertParaPrompt}
            onChange={(e) => setInsertParaPrompt(e.target.value)}
          />
          <div className="flex justify-end mt-2 space-x-2">
            <button
              onClick={onInsertParaCancel}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onInsertParaSubmit}
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
  isSelected,
  isStreaming,
  onCloseMenu,
  chapterId,
  paragraphIndex,
}) => {
  const { handleParagraphSelect } = useBook();
  return (
    <div className={`mb-0 ${isSelected ? "bg-blue-50 rounded-t-lg" : ""}`}>
      <p
        className={`p-2 rounded-t-lg transition-colors duration-200 hover:bg-gray-100 cursor-pointer`}
        onClick={() => handleParagraphSelect(chapterId, paragraphIndex)}
      >
        {content}
        {isStreaming && (
          <AiOutlineLoading3Quarters className="inline-block ml-1 animate-spin text-gray-500" />
        )}
      </p>
      {isSelected && (
        <ParagraphMenu
          content={content}
          paragraphId={paragraphIndex}
          chapterId={chapterId}
          onClose={() => onCloseMenu(chapterId)}
        />
      )}
    </div>
  );
};

export default Paragraph;
