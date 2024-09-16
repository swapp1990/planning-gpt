import React, { useState, useCallback } from "react";
import ParagraphMenu from "./ParagraphMenu";

const Paragraph = ({
  paraInfo,
  onUpdate,
  onRewriteFinalize,
  onDelete,
  onInsertFinalize,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleUpdateParagraph = useCallback(
    (newContent) => {
      onUpdate(newContent);
      setIsMenuOpen(false);
    },
    [onUpdate]
  );

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <div className={`mb-4 ${isMenuOpen ? "bg-blue-50 rounded-lg" : ""}`}>
      <p
        className="p-1 rounded-lg transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {paraInfo.paragraphText}
      </p>
      {/* {isRewriting ? (
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
        
      )} */}
      {isMenuOpen && (
        <ParagraphMenu
          paraInfo={paraInfo}
          onClose={handleMenuClose}
          onRewriteFinalize={onRewriteFinalize}
          onDelete={onDelete}
          onInsertFinalize={onInsertFinalize}
        />
      )}
    </div>
  );
};

export default Paragraph;
