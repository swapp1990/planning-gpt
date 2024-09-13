import React, { useState, useCallback, useEffect } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaSpinner,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useEbook } from "../../context/EbookContext";
import { getGeneratedParagraphs } from "../../server/ebook";
import Paragraph from "./Paragraph";

const Section = ({ section, index: sectionIndex, chapterId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutline, setEditedOutline] = useState(section.outline);
  const [error, setError] = useState(null);
  const [numParagraphs, setNumParagraphs] = useState(3);
  const { ebookState, chapterActions } = useEbook();

  useEffect(() => {
    setEditedOutline(section.outline);
  }, [section.outline]);

  const handleGenerateParagraphs = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const chapter = ebookState.chapters.find((c) => c.id === chapterId);
      const context = {
        parameters: ebookState.parameters,
        synopsis: chapter.synopsis,
      };
      const generatedParagraphs = await getGeneratedParagraphs(
        context,
        editedOutline,
        numParagraphs
      );

      const result = await chapterActions.updateSection(
        chapterId,
        sectionIndex,
        {
          ...section,
          paragraphs: generatedParagraphs,
        }
      );
      if (result.error) {
        setError(result.error);
      }
    } catch (error) {
      console.error("Error generating paragraphs:", error);
      setError("Failed to generate paragraphs. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [
    chapterActions,
    chapterId,
    sectionIndex,
    editedOutline,
    numParagraphs,
    ebookState.parameters,
    ebookState.chapters,
    section,
  ]);

  const handleDeleteSection = useCallback(() => {
    const result = chapterActions.deleteSection(chapterId, sectionIndex);
    if (result.error) {
      setError(result.error);
    }
  }, [chapterActions, chapterId, sectionIndex]);

  const handleEditSection = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    const result = chapterActions.updateSection(chapterId, sectionIndex, {
      ...section,
      outline: editedOutline,
    });
    if (result.error) {
      setError(result.error);
    } else {
      setIsEditing(false);
    }
  }, [chapterActions, chapterId, sectionIndex, section, editedOutline]);

  const handleCancelEdit = useCallback(() => {
    setEditedOutline(section.outline);
    setIsEditing(false);
  }, [section.outline]);

  const handleParagraphUpdate = useCallback(
    async (paragraphIndex, newContent) => {
      const updatedParagraphs = [...section.paragraphs];
      updatedParagraphs[paragraphIndex] = newContent;
      const result = await chapterActions.updateSection(
        chapterId,
        sectionIndex,
        {
          ...section,
          paragraphs: updatedParagraphs,
        }
      );
      if (result.error) {
        setError(result.error);
      }
    },
    [chapterActions, chapterId, sectionIndex, section]
  );

  const handleParagraphDelete = useCallback(
    async (paragraphIndex) => {
      const updatedParagraphs = section.paragraphs.filter(
        (_, index) => index !== paragraphIndex
      );
      const result = await chapterActions.updateSection(
        chapterId,
        sectionIndex,
        {
          ...section,
          paragraphs: updatedParagraphs,
        }
      );
      if (result.error) {
        setError(result.error);
      }
    },
    [chapterActions, chapterId, sectionIndex, section]
  );

  const handleParagraphInsert = useCallback(
    async (paragraphIndex, newContent) => {
      const updatedParagraphs = [
        ...section.paragraphs.slice(0, paragraphIndex + 1),
        newContent,
        ...section.paragraphs.slice(paragraphIndex + 1),
      ];
      const result = await chapterActions.updateSection(
        chapterId,
        sectionIndex,
        {
          ...section,
          paragraphs: updatedParagraphs,
        }
      );
      if (result.error) {
        setError(result.error);
      }
    },
    [chapterActions, chapterId, sectionIndex, section]
  );

  return (
    <div className="my-4 p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between">
        {isEditing ? (
          <textarea
            rows="2"
            value={editedOutline}
            onChange={(e) => setEditedOutline(e.target.value)}
            className="flex-grow mr-2 p-2 border rounded"
          />
        ) : (
          <h3 className="text-lg font-semibold text-gray-800 flex-grow">
            {section.outline}
          </h3>
        )}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {section.paragraphs ? section.paragraphs.length : 0} paragraph(s)
          </span>
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="p-1 text-green-600 hover:text-green-800"
                title="Save changes"
              >
                <FaCheck />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-red-600 hover:text-red-800"
                title="Cancel editing"
              >
                <FaTimes />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEditSection}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="Edit section"
              >
                <FaEdit />
              </button>
              <button
                onClick={handleDeleteSection}
                className="p-1 text-red-600 hover:text-red-800"
                title="Delete section"
              >
                <FaTrash />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-gray-600 hover:text-gray-800"
                title={isExpanded ? "Collapse section" : "Expand section"}
              >
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4">
          {section.paragraphs && section.paragraphs.length > 0 ? (
            section.paragraphs.map((paragraph, pIndex) => (
              <Paragraph
                key={pIndex}
                content={paragraph}
                index={pIndex}
                chapterId={chapterId}
                onUpdate={(newContent) =>
                  handleParagraphUpdate(pIndex, newContent)
                }
                onDelete={() => handleParagraphDelete(pIndex)}
                onInsert={(newContent) =>
                  handleParagraphInsert(pIndex, newContent)
                }
              />
            ))
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label
                  htmlFor="numParagraphs"
                  className="text-sm text-gray-600"
                >
                  Number of paragraphs:
                </label>
                <input
                  type="number"
                  id="numParagraphs"
                  value={numParagraphs}
                  onChange={(e) =>
                    setNumParagraphs(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-16 p-1 border rounded"
                  min="1"
                />
              </div>
              <button
                onClick={handleGenerateParagraphs}
                disabled={isGenerating}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
              >
                {isGenerating ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  "Generate Paragraphs"
                )}
              </button>
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-red-500">{error}</p>}
    </div>
  );
};

export default Section;
