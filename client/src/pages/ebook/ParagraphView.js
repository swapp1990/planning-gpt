import React, { useState, useCallback, useEffect } from "react";
import Paragraph from "./Paragraph";
import ContentGenerator from "./ContentGenerator";

const ParagraphView = ({
  paragraphs,
  chapterId,
  sectionIndex,
  outline,
  onRewriteParagraph,
  onInsertParagraph,
  onDeleteParagraph,
  onAddParagraphs,
}) => {
  const [recentlyUpdatedParagraphs, setRecentlyUpdatedParagraphs] = useState(
    []
  );

  const updateRecentlyUpdatedParagraphs = useCallback((startIndex, count) => {
    const newParagraphIndices = Array.from(
      { length: count },
      (_, i) => startIndex + i
    );
    setRecentlyUpdatedParagraphs(newParagraphIndices);
  }, []);

  //   useEffect(() => {
  //     console.log(recentlyUpdatedParagraphs);
  //     const timer = setTimeout(() => {
  //       setRecentlyUpdatedParagraphs([]);
  //     }, 5000); // Clear after 5 seconds

  //     return () => clearTimeout(timer);
  //   }, [recentlyUpdatedParagraphs]);

  const handleRewriteParagraph = useCallback(
    (pIndex, newParagraphs) => {
      onRewriteParagraph(pIndex, newParagraphs);
      updateRecentlyUpdatedParagraphs(pIndex, newParagraphs.length);
    },
    [onRewriteParagraph, updateRecentlyUpdatedParagraphs]
  );

  const handleInsertParagraph = useCallback(
    (pIndex, newParagraphs) => {
      onInsertParagraph(pIndex, newParagraphs);
      updateRecentlyUpdatedParagraphs(pIndex + 1, newParagraphs.length);
    },
    [onInsertParagraph, updateRecentlyUpdatedParagraphs]
  );

  const handleAddParagraphs = useCallback(
    (newParagraphs) => {
      onAddParagraphs(newParagraphs);
      updateRecentlyUpdatedParagraphs(paragraphs.length, newParagraphs.length);
    },
    [onAddParagraphs, updateRecentlyUpdatedParagraphs, paragraphs.length]
  );

  const renderParagraphs = useCallback(
    (paragraphs) => {
      return paragraphs.map((paragraph, pIndex) => (
        <Paragraph
          key={pIndex}
          paraInfo={{
            chapterId: chapterId,
            sectionId: sectionIndex,
            paragraphId: pIndex,
            paragraphText: paragraph,
          }}
          onRewriteFinalize={(newParagraphs) =>
            handleRewriteParagraph(pIndex, newParagraphs)
          }
          onInsertFinalize={(newParagraphs) =>
            handleInsertParagraph(pIndex, newParagraphs)
          }
          onDelete={() => onDeleteParagraph(pIndex)}
          isRecentlyUpdated={recentlyUpdatedParagraphs.includes(pIndex)}
        />
      ));
    },
    [
      chapterId,
      sectionIndex,
      handleRewriteParagraph,
      handleInsertParagraph,
      onDeleteParagraph,
      recentlyUpdatedParagraphs,
    ]
  );

  const renderDraftParagraphs = useCallback((paragraphs) => {
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="mb-2">
        {paragraph}
      </p>
    ));
  }, []);

  return (
    <div>
      {paragraphs && paragraphs.length > 0 && (
        <div className="mb-4">{renderParagraphs(paragraphs)}</div>
      )}
      <ContentGenerator
        paraInfo={{
          chapterId: chapterId,
          sectionIndex: sectionIndex,
          outline: outline,
        }}
        onFinalize={handleAddParagraphs}
        renderContent={renderDraftParagraphs}
        generationType="new_paragraphs"
        title="Generate new paragraphs"
      />
    </div>
  );
};

export default ParagraphView;
