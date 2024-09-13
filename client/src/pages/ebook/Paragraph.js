import React, { useState, useCallback } from "react";
import ParagraphMenu from "./ParagraphMenu";
import RewriteParagraph from "./RewriteParagraph";

const Paragraph = ({
  content,
  index,
  chapterId,
  onUpdate,
  onDelete,
  onInsert,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState("");

  const handleRewriteOpen = useCallback((instruction) => {
    setRewriteInstruction(instruction);
    setIsRewriting(true);
  }, []);

  const handleRewriteComplete = () => {
    // console.log("handleRewriteComplete");
    // setIsRewriting(false);
    // setRewriteInstruction("");
  };

  const handleUpdateParagraph = useCallback(
    (newContent) => {
      onUpdate(newContent);
      setIsRewriting(false);
      setIsMenuOpen(false);
      setRewriteInstruction("");
    },
    [onUpdate]
  );

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
    setRewriteInstruction("");
    setIsRewriting(false);
  }, []);

  return (
    <div className={`mb-4 ${isMenuOpen ? "bg-blue-50 rounded-lg" : ""}`}>
      {isRewriting ? (
        <RewriteParagraph
          content={content}
          index={index}
          instruction={rewriteInstruction}
          onRewriteComplete={handleRewriteComplete}
          isRewriting={isRewriting}
          onUpdateParagraph={handleUpdateParagraph}
          isCancelled={false}
        />
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
          onClose={handleMenuClose}
          onRewrite={handleRewriteOpen}
          onDelete={onDelete}
          onInsert={onInsert}
          onCancel={() => setIsRewriting(false)}
        />
      )}
    </div>
  );
};

export default Paragraph;
