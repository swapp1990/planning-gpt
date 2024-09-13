import React, { useState, useCallback, useEffect } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaSpinner,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaRedo,
  FaSave,
  FaMagic,
} from "react-icons/fa";
import { useEbook } from "../../context/EbookContext";
import { getGeneratedParagraphs } from "../../server/ebook";
import Paragraph from "./Paragraph";

const ParagraphGenerationMenu = ({
  instruction,
  setInstruction,
  numParagraphs,
  setNumParagraphs,
  onGenerate,
  isGenerating,
  hasDraft,
}) => {
  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-lg shadow-sm">
      <div className="flex flex-col space-y-2">
        <label
          htmlFor="instruction"
          className="text-sm font-medium text-gray-700"
        >
          Instructions for AI:
        </label>
        <textarea
          id="instruction"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          placeholder="Enter instructions for generating or rewriting paragraphs..."
        />
      </div>
      <div className="flex flex-wrap items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label
            htmlFor="numParagraphs"
            className="text-sm font-medium text-gray-700"
          >
            Paragraphs:
          </label>
          <input
            type="number"
            id="numParagraphs"
            value={numParagraphs}
            onChange={(e) =>
              setNumParagraphs(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-16 p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
          />
        </div>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex-grow sm:flex-grow-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
        >
          {isGenerating ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <FaMagic className="mr-2" />
              {hasDraft ? "Rewrite Paragraphs" : "Generate Paragraphs"}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const Section = ({ section, index: sectionIndex, chapterId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutline, setEditedOutline] = useState(section.outline);
  const [error, setError] = useState(null);
  const [numParagraphs, setNumParagraphs] = useState(3);
  const [draftParagraphs, setDraftParagraphs] = useState([]);
  const [instruction, setInstruction] = useState("");
  const { ebookState, chapterActions } = useEbook();

  useEffect(() => {
    setEditedOutline(section.outline);
  }, [section.outline]);

  const handleGenerateParagraphs = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const chapter = ebookState.chapters.find((c) => c.id === chapterId);
      const outlinesList = chapter.sections.map((s) => s.outline).join("\n");
      const context = {
        parameters: ebookState.parameters,
        synopsis: chapter.synopsis,
        previous_paragraphs: section.paragraphs.join("\n"),
        outline: editedOutline,
        outlinesList: outlinesList,
      };
      const generatedParagraphs = await getGeneratedParagraphs(
        context,
        instruction,
        numParagraphs
      );

      setDraftParagraphs(generatedParagraphs);
    } catch (error) {
      console.error("Error generating paragraphs:", error);
      setError("Failed to generate paragraphs. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [
    chapterId,
    editedOutline,
    numParagraphs,
    instruction, // Add instruction to dependencies
    ebookState.parameters,
    ebookState.chapters,
  ]);

  const handleFinalizeDraft = useCallback(async () => {
    const result = await chapterActions.updateSection(chapterId, sectionIndex, {
      ...section,
      paragraphs: [...section.paragraphs, ...draftParagraphs],
    });
    if (result.error) {
      setError(result.error);
    } else {
      setDraftParagraphs([]);
    }
  }, [chapterActions, chapterId, sectionIndex, section, draftParagraphs]);

  const handleRewriteDraft = useCallback(() => {
    handleGenerateParagraphs();
  }, [handleGenerateParagraphs]);

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
    async (paragraphIndex, newContent, isDraft) => {
      if (isDraft) {
        const updatedDrafts = draftParagraphs;
        updatedDrafts[paragraphIndex] = newContent;
        setDraftParagraphs(updatedDrafts);
      } else {
        // Update finalized paragraphs
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

  const handleDraftParagraphDelete = useCallback((paragraphIndex) => {
    setDraftParagraphs((prevDrafts) =>
      prevDrafts.filter((_, index) => index !== paragraphIndex)
    );
  }, []);

  const handleDraftParagraphInsert = useCallback(
    (paragraphIndex, newContent) => {
      setDraftParagraphs((prevDrafts) => [
        ...prevDrafts.slice(0, paragraphIndex + 1),
        newContent,
        ...prevDrafts.slice(paragraphIndex + 1),
      ]);
    },
    []
  );

  const renderParagraphs = useCallback(
    (paragraphs, isDraft = false) => {
      return paragraphs.map((paragraph, pIndex) => (
        <Paragraph
          key={`${isDraft ? "draft-" : ""}${pIndex}`}
          content={paragraph}
          index={pIndex}
          chapterId={chapterId}
          onUpdate={(newContent) =>
            handleParagraphUpdate(pIndex, newContent, isDraft)
          }
          onDelete={() =>
            isDraft
              ? handleDraftParagraphDelete(pIndex)
              : handleParagraphDelete(pIndex)
          }
          onInsert={(newContent) =>
            isDraft
              ? handleDraftParagraphInsert(pIndex, newContent)
              : handleParagraphInsert(pIndex, newContent)
          }
          isDraft={isDraft}
        />
      ));
    },
    [
      chapterId,
      handleParagraphUpdate,
      handleParagraphDelete,
      handleParagraphInsert,
      draftParagraphs,
    ]
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
          {section.paragraphs && section.paragraphs.length > 0 && (
            <div className="mb-4">{renderParagraphs(section.paragraphs)}</div>
          )}
          {draftParagraphs.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-md font-semibold text-blue-700 mb-2">
                Draft Paragraphs
              </h4>
              {renderParagraphs(draftParagraphs, true)}
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={handleRewriteDraft}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors duration-200 flex items-center"
                >
                  <FaRedo className="mr-2" /> Rewrite Draft
                </button>
                <button
                  onClick={handleFinalizeDraft}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
                >
                  <FaSave className="mr-2" /> Finalize Draft
                </button>
              </div>
            </div>
          )}
          <ParagraphGenerationMenu
            instruction={instruction}
            setInstruction={setInstruction}
            numParagraphs={numParagraphs}
            setNumParagraphs={setNumParagraphs}
            onGenerate={handleGenerateParagraphs}
            isGenerating={isGenerating}
            hasDraft={draftParagraphs.length > 0}
          />
        </div>
      )}
      {error && <p className="mt-2 text-red-500">{error}</p>}
    </div>
  );
};

export default Section;
