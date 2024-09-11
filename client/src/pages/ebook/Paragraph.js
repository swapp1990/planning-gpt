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

import ParagraphReview from "./ParagraphReview";
import ParagraphMenu from "./ParagraphMenu";
import SelectableSentence from "./SelectableSentence";
import { useEbook } from "../../context/EbookContext";

const Paragraph = ({
  content,
  index,
  chapterId,
  isRewriteMode,
  onNoteChange,
}) => {
  const { chapterActions } = useEbook();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState("");

  const handleEditClick = () => {
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    await chapterActions.editParagraph(chapterId, index, editedContent);
    setIsEditing(false);
    setIsLoading(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleDelete = async (chapterId, index) => {
    setIsLoading(true);
    await chapterActions.deleteParagraph(chapterId, index);
    setIsLoading(false);
  };

  const handleRewrite = async (instruction) => {
    setIsLoading(true);
    const result = await chapterActions.rewriteParagraph(
      chapterId,
      index,
      instruction
    );
    if (result.newParagraph) {
      setRewrittenContent(result.newParagraph);
      setIsReviewOpen(true);
    }
    setIsLoading(false);
  };

  const handleInsert = async (newContent) => {
    setIsLoading(true);
    await chapterActions.insertParagraph(chapterId, index + 1, newContent);
    setIsLoading(false);
  };

  const handleReviewSave = async (finalContent) => {
    setIsLoading(true);
    await chapterActions.applyRewrite(chapterId, index, finalContent);
    setIsReviewOpen(false);
    setIsLoading(false);
  };

  return (
    <div className={`${isMenuOpen ? "bg-blue-50 rounded-lg" : ""}`}>
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            className="w-full p-2 border rounded"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
              disabled={isLoading}
            >
              <FaTimes className="mr-1" /> Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <AiOutlineLoading3Quarters className="animate-spin mr-2" />
              ) : (
                <FaCheck className="mr-1" />
              )}
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {isRewriteMode ? (
            content
              .split(". ")
              .map((sentence, sentenceIndex) => (
                <SelectableSentence
                  key={sentenceIndex}
                  sentence={sentence}
                  index={`${index}-${sentenceIndex}`}
                  onNoteChange={onNoteChange}
                />
              ))
          ) : (
            <p
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {content}
            </p>
          )}

          {isMenuOpen && (
            <ParagraphMenu
              content={content}
              chapterId={chapterId}
              paragraphId={index}
              onClose={() => setIsMenuOpen(false)}
              onRewrite={handleRewrite}
              onDelete={handleDelete}
              onInsert={handleInsert}
            />
          )}
        </>
      )}
      {isReviewOpen && (
        <ParagraphReview
          original={content}
          edited={rewrittenContent}
          onSave={handleReviewSave}
          onCancel={() => setIsReviewOpen(false)}
        />
      )}
    </div>
  );
};

export default Paragraph;
