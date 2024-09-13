import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaSpinner,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaRedo,
  FaPlus,
  FaMagic,
  FaTimesCircle,
} from "react-icons/fa";
import { useEbook } from "../../context/EbookContext";
import { getGeneratedParagraphs } from "../../server/ebook";
import Paragraph from "./Paragraph";
import GenerationMenu from "./GenerationMenu";

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

  const draftRef = useRef(null);

  useEffect(() => {
    setEditedOutline(section.outline);
  }, [section.outline]);

  const handleGenerateParagraphs = useCallback(async () => {
    setTimeout(() => {
      draftRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
    setIsGenerating(true);
    setError(null);

    try {
      const chapter = ebookState.chapters.find((c) => c.id === chapterId);
      const outlinesList = chapter.sections.map((s) => s.outline).join("\n");
      const context = {
        parameters: ebookState.parameters,
        synopsis: chapter.synopsis,
        previous_paragraphs: section.paragraphs.join("\n"),
        draft_paragraphs: draftParagraphs.join("\n\n"),
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

  const toggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

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

  const handleCloseDraft = useCallback(() => {
    setDraftParagraphs([]);
    setInstruction("");
  }, []);

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
    <div className="my-4 p-1 bg-white rounded-lg shadow-md border border-gray-200">
      <div
        className={`p-2 sm:p-4 cursor-pointer transition-colors duration-200 ${
          isExpanded ? "bg-gray-50" : "hover:bg-gray-50"
        }`}
        onClick={toggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex-grow mr-4 w-[50px]">
            {isEditing ? (
              <textarea
                rows="2"
                value={editedOutline}
                onChange={(e) => setEditedOutline(e.target.value)}
                className="w-full p-2 text-lg font-semibold text-gray-800 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-800 break-words sm:break-normal sm:whitespace-normal truncate sm:overflow-visible sm:text-ellipsis">
                {section.outline}
              </h3>
            )}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-sm text-gray-500 hidden sm:inline">
              {section.paragraphs ? section.paragraphs.length : 0} paragraph(s)
            </span>
            {isEditing ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit();
                  }}
                  className="p-1 text-green-600 hover:text-green-800"
                  title="Save changes"
                >
                  <FaCheck />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEdit();
                  }}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Cancel editing"
                >
                  <FaTimes />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditSection();
                  }}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="Edit section"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSection();
                  }}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Delete section"
                >
                  <FaTrash />
                </button>
              </>
            )}
            <div className="text-gray-400">
              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-1 border-t border-gray-200">
          {section.paragraphs && section.paragraphs.length > 0 && (
            <div className="mb-4">{renderParagraphs(section.paragraphs)}</div>
          )}
          {draftParagraphs.length > 0 ? (
            <div
              ref={draftRef}
              className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-md font-semibold text-yellow-700">
                  Draft Paragraphs
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={handleFinalizeDraft}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
                  >
                    <FaPlus className="mr-2" />
                    Finalize
                  </button>
                  <button
                    onClick={handleCloseDraft}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors duration-200"
                    aria-label="Close generated outlines"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {isGenerating ? (
                <div className="flex items-center justify-center p-4">
                  <FaSpinner className="animate-spin text-blue-500 mr-2" />
                  <span className="text-blue-500">
                    Regenerating paragraphs...
                  </span>
                </div>
              ) : (
                <>
                  {renderParagraphs(draftParagraphs, true)}
                  <GenerationMenu
                    instruction={instruction}
                    setInstruction={setInstruction}
                    count={numParagraphs}
                    setCount={setNumParagraphs}
                    onGenerate={handleRewriteDraft}
                    isLoading={isGenerating}
                    isRegeneration={true}
                    generationType="paragraphs"
                  />
                </>
              )}
            </div>
          ) : (
            <GenerationMenu
              instruction={instruction}
              setInstruction={setInstruction}
              count={numParagraphs}
              setCount={setNumParagraphs}
              onGenerate={handleGenerateParagraphs}
              isLoading={isGenerating}
              generationType="paragraphs"
            />
          )}
        </div>
      )}
      {error && <p className="mt-2 text-red-500">{error}</p>}
    </div>
  );
};

export default Section;
