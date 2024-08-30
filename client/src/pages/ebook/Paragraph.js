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

  const computeLCS = (X, Y) => {
    const m = X.length;
    const n = Y.length;
    const L = Array(m + 1)
      .fill()
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) {
      for (let j = 0; j <= n; j++) {
        if (i == 0 || j == 0) L[i][j] = 0;
        else if (X[i - 1] === Y[j - 1]) L[i][j] = L[i - 1][j - 1] + 1;
        else L[i][j] = Math.max(L[i - 1][j], L[i][j - 1]);
      }
    }
    return L;
  };

  const backtrack = (L, X, Y, i, j) => {
    if (i == 0 || j == 0) return [];

    if (X[i - 1] === Y[j - 1]) {
      return [
        ...backtrack(L, X, Y, i - 1, j - 1),
        { type: "unchanged", content: X[i - 1] },
      ];
    }

    if (L[i][j - 1] > L[i - 1][j]) {
      return [
        ...backtrack(L, X, Y, i, j - 1),
        { type: "addition", content: Y[j - 1], status: "pending" },
      ];
    }

    return [
      ...backtrack(L, X, Y, i - 1, j),
      { type: "deletion", content: X[i - 1], status: "pending" },
    ];
  };

  const levenshteinDistance = (a, b) => {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) == a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  };

  const isSimilar = (a, b, threshold = 0.7) => {
    const distance = levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);
    const similarity = 1 - distance / maxLength;
    return similarity >= threshold;
  };

  const computeDiff = (original, edited) => {
    const originalSentences = original.split(/(?<=[.!?])\s+/);
    const editedSentences = edited.split(/(?<=[.!?])\s+/);
    let diff = [];
    let i = 0,
      j = 0;

    while (i < originalSentences.length || j < editedSentences.length) {
      if (i >= originalSentences.length) {
        diff.push({
          type: "addition",
          content: editedSentences[j],
          status: "pending",
        });
        j++;
      } else if (j >= editedSentences.length) {
        diff.push({
          type: "deletion",
          content: originalSentences[i],
          status: "pending",
        });
        i++;
      } else if (originalSentences[i] === editedSentences[j]) {
        diff.push({ type: "unchanged", content: originalSentences[i] });
        i++;
        j++;
      } else if (isSimilar(originalSentences[i], editedSentences[j])) {
        diff.push({
          type: "modification",
          original: originalSentences[i],
          modified: editedSentences[j],
          status: "pending",
        });
        i++;
        j++;
      } else {
        // Look ahead to find potential matches or modifications
        let foundMatch = false;
        for (
          let k = 1;
          k < 3 &&
          i + k < originalSentences.length &&
          j + k < editedSentences.length;
          k++
        ) {
          if (
            originalSentences[i + k] === editedSentences[j] ||
            isSimilar(originalSentences[i + k], editedSentences[j])
          ) {
            // Sentences before the match are considered deletions
            for (let m = 0; m < k; m++) {
              diff.push({
                type: "deletion",
                content: originalSentences[i + m],
                status: "pending",
              });
            }
            i += k;
            foundMatch = true;
            break;
          } else if (
            originalSentences[i] === editedSentences[j + k] ||
            isSimilar(originalSentences[i], editedSentences[j + k])
          ) {
            // Sentences before the match are considered additions
            for (let m = 0; m < k; m++) {
              diff.push({
                type: "addition",
                content: editedSentences[j + m],
                status: "pending",
              });
            }
            j += k;
            foundMatch = true;
            break;
          }
        }
        if (!foundMatch) {
          // If no match found, consider it as a deletion and an addition
          diff.push({
            type: "deletion",
            content: originalSentences[i],
            status: "pending",
          });
          diff.push({
            type: "addition",
            content: editedSentences[j],
            status: "pending",
          });
          i++;
          j++;
        }
      }
    }

    return diff;
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
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
};

const ParagraphMenu = ({
  content,
  onClose,
  onRewrite,
  onContParagraph,
  makeApplyReview,
}) => {
  const [rewritePrompt, setRewritePrompt] = React.useState("");
  const [rewriteResponse, setRewriteResponse] = React.useState(null);
  const [contParagraphPrompt, setContParagraphPrompt] = useState("");
  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const [isContParagraphOpen, setIsContParagraphOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRewriteReviewOpen, setIsRewriteReviewOpen] = useState(false);

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
      setRewriteResponse(response.newParagraph);
      setIsRewriteReviewOpen(true);
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

  const handleReviewApply = (newParagraph) => {
    setIsRewriteReviewOpen(false);
    makeApplyReview(newParagraph);
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
      {isRewriteReviewOpen && (
        <ParagraphReview
          original={content}
          edited={rewriteResponse}
          onSave={handleReviewApply}
          onCancel={onReviewCancel}
        />
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
  onReviewApply,
  onCloseMenu,
  chapterId,
  paragraphIndex,
}) => {
  const makeApplyReview = (newParagraph) => {
    onReviewApply(newParagraph, chapterId, paragraphIndex);
  };

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
          content={content}
          onClose={() => onCloseMenu(chapterId)}
          onRewrite={(prompt) => onRewrite(chapterId, paragraphIndex, prompt)}
          onContParagraph={(prompt) =>
            onInsertParagraph(chapterId, paragraphIndex, prompt)
          }
          makeApplyReview={(newParagraph) => makeApplyReview(newParagraph)}
        />
      )}
    </div>
  );
};

export default Paragraph;
