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

import ParagraphMenu from "./ParagraphMenu";
import SelectableSentence from "./SelectableSentence";
import RewriteParagraph from "./RewriteParagraph";
import { useEbook } from "../../context/EbookContext";

const Paragraph = ({
  content,
  index,
  chapterId,
  isRewriteMode,
  onNoteChange,
}) => {
  const { chapterActions } = useEbook();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isRewritingComplete, setIsRewritingComplete] = useState(false);
  const [openRewriting, setOpenRewriting] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const [isCancelled, setIsCancelled] = useState(false);

  const handleDelete = async (chapterId, index) => {
    setIsLoading(true);
    await chapterActions.deleteParagraph(chapterId, index);
    setIsLoading(false);
  };

  const handleRewriteOpen = async (instruction) => {
    setRewriteInstruction(instruction);
    setOpenRewriting(true);
    setIsRewriting(true);
    setIsCancelled(false);
  };

  const handleRewriteComplete = () => {
    // setIsRewriting(false);
    // setRewriteInstruction("");
    setIsRewritingComplete(true);
  };

  const handleInsert = async (newContent) => {
    setIsLoading(true);
    await chapterActions.insertParagraph(chapterId, index + 1, newContent);
    setIsLoading(false);
  };

  const handleMenuRewriteCancel = () => {
    console.log("handleMenuRewriteCancel");
    setIsCancelled(true);
    setIsRewriting(false);
    setOpenRewriting(false);
  };

  const handleMenuClose = () => {
    setIsLoading(false);
    setIsMenuOpen(false);
    setRewriteInstruction("");
    setIsRewriting(false);
    setOpenRewriting(false);
  };

  const handleUpdateParagraph = async (index, newContent) => {
    setIsRewritingComplete(true);
    setIsLoading(false);
    setIsMenuOpen(false);
    setRewriteInstruction("");
    setOpenRewriting(false);
    await chapterActions.applyRewrite(chapterId, index, newContent);
  };

  return (
    <div className={`${isMenuOpen ? "bg-blue-50 rounded-lg" : ""}`}>
      {openRewriting ? (
        <RewriteParagraph
          content={content}
          index={index}
          instruction={rewriteInstruction}
          onRewriteComplete={handleRewriteComplete}
          isRewriting={isRewriting}
          onUpdateParagraph={handleUpdateParagraph}
          isCancelled={isCancelled}
        />
      ) : (
        <p
          className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {content}
        </p>
      )}
      {/* {isRewriting && !isRewritingComplete && (
        <button
          onClick={handleCancelRewrite}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
        >
          Cancel Rewrite
        </button>
      )}
      {isRewritingComplete && (
        <button
          onClick={handleSubmitRewrite}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
        >
          Submit Rewrite
        </button>
      )} */}
      {isMenuOpen && (
        <ParagraphMenu
          content={content}
          chapterId={chapterId}
          paragraphId={index}
          onClose={handleMenuClose}
          onRewrite={handleRewriteOpen}
          onDelete={handleDelete}
          onInsert={handleInsert}
          onCancel={handleMenuRewriteCancel}
        />
      )}
    </div>
  );
};

export default Paragraph;
