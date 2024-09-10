import React, { useEffect, useState, useCallback } from "react";
import { useEbook } from "../../context/EbookContext";
import { FaEdit, FaCheck, FaTimes, FaPlus, FaSync } from "react-icons/fa";

import Synopsis from "./Synopsis";
import Paragraph from "./Paragraph";
import RewriteParagraph from "./RewriteParagraph";
import ContinueChapter from "./ContinueChapter";

const ChapterView = ({ chapter }) => {
  const { chapterActions } = useEbook();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isContinueChapter, setIsContinueChapter] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chapter.title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isRewriteMode, setIsRewriteMode] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const [rewriteNotes, setRewriteNotes] = useState({});
  const [rewritingParagraphs, setRewritingParagraphs] = useState([]);
  const [updatedContent, setUpdatedContent] = useState(chapter.content);

  useEffect(() => {
    // console.log(chapter);
    setEditedTitle(chapter.title);
  }, [chapter.title]);

  useEffect(() => {
    if (chapter.content) {
      console.log(chapter.content);
      setUpdatedContent(chapter.content);
    }
  }, [chapter.content]);

  const handleTitleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await chapterActions.updateChapterTitle(chapter.id, editedTitle);
      setIsEditingTitle(false);
    } catch (err) {
      setError("Failed to update chapter title. Please try again.");
    }
    setIsLoading(false);
  };

  const handleSynopsisEdit = async (newSynopsis) => {
    setIsLoading(true);
    setError(null);
    try {
      await chapterActions.updateChapter(chapter.id, { synopsis: newSynopsis });
    } catch (err) {
      setError("Failed to update synopsis. Please try again.");
    }
    setIsLoading(false);
  };

  const handleParagraphEdit = async (index, newContent) => {
    setIsLoading(true);
    setError(null);
    try {
      await chapterActions.updateParagraph(chapter.id, index, newContent);
    } catch (err) {
      setError("Failed to update paragraph. Please try again.");
    }
    setIsLoading(false);
  };

  const handleParagraphDelete = async (index) => {
    setIsLoading(true);
    setError(null);
    try {
      await chapterActions.deleteParagraph(chapter.id, index);
    } catch (err) {
      console.log(err);
      setError("Failed to delete paragraph. Please try again.");
    }
    setIsLoading(false);
  };

  const handleNoteChange = (paragraphIndex, sentenceIndex, note) => {
    setRewriteNotes((prevNotes) => ({
      ...prevNotes,
      [`${paragraphIndex}-${sentenceIndex}`]: note,
    }));
  };

  const handleStartRewrite = useCallback(() => {
    setIsRewriting(true);
    setRewritingParagraphs(updatedContent.map((_, index) => index));
  }, [updatedContent]);

  const handleRewriteComplete = useCallback(
    (paragraphIndex) => {
      setRewritingParagraphs((prev) =>
        prev.filter((index) => index !== paragraphIndex)
      );
      if (rewritingParagraphs.length === 1) {
        setIsRewriting(false);
      }
    },
    [rewritingParagraphs]
  );

  const handleUpdateParagraph = useCallback((index, newContent) => {
    console.log(index, newContent);
    let newParagraphs = updatedContent;
    newParagraphs[index] = newContent;
    setUpdatedContent(newParagraphs);
  }, []);

  const handleCancelRewrite = () => {
    setIsRewriteMode(false);
    setRewriteInstruction("");
    setIsRewriting(false);
    setRewritingParagraphs([]);
    setUpdatedContent(chapter.content);
  };

  const handleSubmitRewrite = () => {
    // Here you would handle the actual rewrite submission
    console.log("Rewrite instruction:", rewriteInstruction);
    console.log("Updated content:", updatedContent);
    // You might want to call a function here to update the chapter content in your global state or database
    setIsRewriteMode(false);
    setRewriteInstruction("");
    setIsRewriting(false);
    setRewritingParagraphs([]);
  };

  return (
    <div className="bg-white shadow rounded-lg p-2 sm:p-6">
      {isEditingTitle ? (
        <div className="mb-4">
          <input
            type="text"
            className="w-full p-2 text-2xl font-bold border rounded"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={handleTitleSave}
              className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={isLoading}
            >
              <FaCheck />
            </button>
            <button
              onClick={() => setIsEditingTitle(false)}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={isLoading}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center mb-4">
          <h2 className="text-2xl font-bold mr-2">{chapter.title}</h2>
          <button
            onClick={() => setIsEditingTitle(true)}
            className="p-1 text-blue-500 hover:text-blue-600"
            aria-label="Edit chapter title"
          >
            <FaEdit className="w-5 h-5" />
          </button>
        </div>
      )}
      <Synopsis
        chapter={chapter}
        chapterId={chapter.id}
        onEdit={handleSynopsisEdit}
      />
      {updatedContent.map((p, index) =>
        isRewriteMode ? (
          <RewriteParagraph
            key={index}
            content={p}
            index={index}
            instruction={rewriteInstruction}
            onRewriteComplete={handleRewriteComplete}
            isRewriting={isRewriting && rewritingParagraphs.includes(index)}
            onUpdateParagraph={handleUpdateParagraph}
          />
        ) : (
          <Paragraph
            key={index}
            content={p}
            index={index}
            chapterId={chapter.id}
            onEdit={handleParagraphEdit}
            onDelete={handleParagraphDelete}
          />
        )
      )}

      {/* {isContinueChapter ? (
        <ContinueChapter
          chapterId={chapter.id}
          onClose={() => setIsContinueChapter(false)}
        />
      ) : (
        <button
          onClick={() => setIsContinueChapter(true)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
        >
          Continue
        </button>
      )} */}

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setIsRewriteMode(!isRewriteMode)}
          className={`px-4 py-2 rounded-md transition-colors duration-200 ${
            isRewriteMode
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          <FaSync className="inline-block mr-2" />
          {isRewriteMode ? "Exit Rewrite Mode" : "Enter Rewrite Mode"}
        </button>

        {!isRewriteMode && (
          <button
            onClick={() => setIsContinueChapter(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
          >
            Continue
          </button>
        )}
      </div>

      {isRewriteMode && (
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
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200"
            >
              Start Rewrite
            </button>
            <button
              onClick={handleSubmitRewrite}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
            >
              Submit Rewrite
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="mt-4 text-gray-600">Loading...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default ChapterView;
