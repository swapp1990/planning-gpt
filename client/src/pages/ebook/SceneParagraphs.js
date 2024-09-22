import React, { useState, useCallback } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import Paragraph from "./Paragraph";
import ContentGenerator from "./ContentGenerator";

const SceneParagraphs = ({
  scene,
  chapterId,
  sectionIndex,
  sceneIndex,
  onUpdateParagraphs,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const handleRewriteParagraph = useCallback(
    (pIndex, newParagraphs) => {
      const updatedParagraphs = [...scene.paragraphs];
      updatedParagraphs.splice(pIndex, 1, ...newParagraphs);
      onUpdateParagraphs(updatedParagraphs);
      updateRecentlyUpdatedParagraphs(pIndex, newParagraphs.length);
    },
    [scene.paragraphs, onUpdateParagraphs, updateRecentlyUpdatedParagraphs]
  );

  const handleInsertParagraph = useCallback(
    (pIndex, newParagraphs) => {
      const updatedParagraphs = [...scene.paragraphs];
      updatedParagraphs.splice(pIndex + 1, 0, ...newParagraphs);
      onUpdateParagraphs(updatedParagraphs);
      updateRecentlyUpdatedParagraphs(pIndex + 1, newParagraphs.length);
    },
    [scene.paragraphs, onUpdateParagraphs, updateRecentlyUpdatedParagraphs]
  );

  const handleDeleteParagraph = useCallback(
    (pIndex) => {
      const updatedParagraphs = scene.paragraphs.filter(
        (_, index) => index !== pIndex
      );
      onUpdateParagraphs(updatedParagraphs);
    },
    [scene.paragraphs, onUpdateParagraphs]
  );

  const handleAddParagraphs = useCallback(
    (newParagraphs) => {
      const updatedParagraphs = [...(scene.paragraphs || []), ...newParagraphs];
      onUpdateParagraphs(updatedParagraphs);
      // updateRecentlyUpdatedParagraphs(
      //   scene.paragraphs.length,
      //   newParagraphs.length
      // );
    },
    [scene.paragraphs, onUpdateParagraphs, updateRecentlyUpdatedParagraphs]
  );

  const renderParagraphs = useCallback(
    (paragraphs) => {
      return paragraphs.map((paragraph, pIndex) => (
        <Paragraph
          key={pIndex}
          paraInfo={{
            chapterId: chapterId,
            sectionId: sectionIndex,
            sceneId: sceneIndex,
            paragraphId: pIndex,
            paragraphText: paragraph,
          }}
          onRewriteFinalize={(newParagraphs) =>
            handleRewriteParagraph(pIndex, newParagraphs)
          }
          onInsertFinalize={(newParagraphs) =>
            handleInsertParagraph(pIndex, newParagraphs)
          }
          onDelete={() => handleDeleteParagraph(pIndex)}
          isRecentlyUpdated={recentlyUpdatedParagraphs.includes(pIndex)}
        />
      ));
    },
    [
      chapterId,
      sectionIndex,
      sceneIndex,
      handleRewriteParagraph,
      handleInsertParagraph,
      handleDeleteParagraph,
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
    <div className="border rounded-lg shadow-sm bg-white border-gray-200 mb-4">
      <div
        className="p-4 cursor-pointer flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold">
          {scene.title || `Scene ${sceneIndex + 1}`}
        </h3>
        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
      </div>
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {scene.paragraphs && scene.paragraphs.length > 0 && (
            <div className="mb-4">{renderParagraphs(scene.paragraphs)}</div>
          )}
          <ContentGenerator
            paraInfo={{
              chapterId: chapterId,
              sectionIndex: sectionIndex,
              sceneIndex: sceneIndex,
            }}
            onFinalize={handleAddParagraphs}
            renderContent={renderDraftParagraphs}
            generationType="new_paragraphs"
            title="Generate new paragraphs for this scene"
          />
        </div>
      )}
    </div>
  );
};

export default SceneParagraphs;
