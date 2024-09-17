import React, { useState, useCallback, useEffect } from "react";
import ParagraphMenu from "./ParagraphMenu";

const Paragraph = ({
  paraInfo,
  onRewriteFinalize,
  onDelete,
  onInsertFinalize,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleRewriteFinalize = useCallback(
    (...args) => {
      onRewriteFinalize(...args);
      handleMenuClose();
    },
    [onRewriteFinalize, handleMenuClose]
  );

  const handleInsertFinalize = useCallback(
    (...args) => {
      onInsertFinalize(...args);
      handleMenuClose();
    },
    [onInsertFinalize, handleMenuClose]
  );

  const highlightClass = paraInfo.isRecentlyUpdated
    ? "bg-green-100 transition-colors duration-500"
    : "";

  return (
    <div className={`mb-4 ${isMenuOpen ? "bg-blue-50 rounded-lg" : ""}`}>
      <p
        className={`p-1 rounded-lg transition-colors duration-200 hover:bg-gray-100 cursor-pointer ${highlightClass}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {paraInfo.paragraphText}
      </p>
      {isMenuOpen && (
        <ParagraphMenu
          paraInfo={paraInfo}
          onClose={handleMenuClose}
          onRewriteFinalize={handleRewriteFinalize}
          onDelete={onDelete}
          onInsertFinalize={handleInsertFinalize}
        />
      )}
    </div>
  );
};

export default Paragraph;
