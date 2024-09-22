import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaSpinner,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaParagraph,
  FaFilm,
  FaMagic,
  FaTimesCircle,
  FaFileAlt,
} from "react-icons/fa";
import { useEbook } from "../../context/EbookContext";
import { getSectionSummary } from "../../server/ebook";
import TabSystem from "../../components/TabSystem";
import SceneView from "./SceneView";
import ParagraphView from "./ParagraphView";
import ClearableTextarea from "../../components/ClearableTextarea";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {title}
          </h3>
          <div className="mt-2 px-7 py-3">{children}</div>
          <div className="items-center px-4 py-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Section = ({ section, index: sectionIndex, chapterId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutline, setEditedOutline] = useState(section.outline);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const { ebookState, chapterActions } = useEbook();

  useEffect(() => {
    // console.log(ebookState);
  }, [ebookState]);

  useEffect(() => {
    setEditedOutline(section.outline);
  }, [section.outline]);

  const openSummaryModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleGenerateSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    const chapter = ebookState.chapters.find((c) => c.id === chapterId);
    let context = {
      parameters: ebookState.parameters,
      synopsis: chapter.synopsis,
    };
    let paragraphs = section.paragraphs.join("\n");
    let previous_summary = chapter.sections[sectionIndex - 1].summary;
    try {
      const generatedSummary = await getSectionSummary(
        context,
        paragraphs,
        previous_summary
      );
      // setSummary(generatedSummary);
      const result = await chapterActions.updateSection(
        chapterId,
        sectionIndex,
        {
          ...section,
          summary: generatedSummary,
        }
      );
    } catch (error) {
      console.error("Error generating summary:", error);
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsSummaryLoading(false);
    }
  }, [
    ebookState.chapters,
    ebookState.parameters,
    chapterId,
    section.paragraphs,
  ]);

  const toggleExpand = useCallback(async () => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleDeleteSection = useCallback(() => {
    const result = chapterActions.deleteSection(chapterId, sectionIndex);
    if (result.error) {
      setError(result.error);
    }
  }, [chapterActions, chapterId, sectionIndex]);

  const handleEditSectionOutline = useCallback(() => {
    setError(null);
    setIsEditing(true);
  }, []);

  const handleSaveEditedOutline = useCallback(() => {
    setError(null);
    if (!editedOutline || editedOutline == "") {
      setError("Error");
      return;
    }
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

  const handleCancelEditing = useCallback(() => {
    setEditedOutline(section.outline);
    setError(null);
    setIsEditing(false);
  }, [section.outline]);

  const handleAddParagraphs = useCallback(
    async (newParagraphs) => {
      const result = await chapterActions.updateSection(
        chapterId,
        sectionIndex,
        {
          ...section,
          paragraphs: [...section.paragraphs, ...newParagraphs],
        }
      );
      if (result.error) {
        throw new Error(result.error);
      }
    },
    [chapterActions, chapterId, sectionIndex, section]
  );

  const handleInsertParagraph = useCallback(
    async (paragraphIndex, newParagraphs) => {
      let updatedParagraphs = [...section.paragraphs];
      updatedParagraphs.splice(paragraphIndex + 1, 0, ...newParagraphs);
      await chapterActions.updateSection(chapterId, sectionIndex, {
        ...section,
        paragraphs: updatedParagraphs,
      });
    },
    [chapterActions, chapterId, sectionIndex, section]
  );

  const handleRewriteParagraph = useCallback(
    async (paragraphIndex, newParagraphs) => {
      let updatedParagraphs = [...section.paragraphs];
      updatedParagraphs.splice(paragraphIndex, 1, ...newParagraphs);
      await chapterActions.updateSection(chapterId, sectionIndex, {
        ...section,
        paragraphs: updatedParagraphs,
      });
    },
    [chapterActions, chapterId, sectionIndex, section]
  );

  const handleDeleteParagraph = useCallback(
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
        throw new Error(result.error);
      }
    },
    [chapterActions, chapterId, sectionIndex, section]
  );

  const handleUpdateScene = useCallback(
    (updatedScenes) => {
      chapterActions.updateSection(chapterId, sectionIndex, {
        ...section,
        scenes: updatedScenes,
      });
    },
    [chapterActions, chapterId, sectionIndex, section]
  );

  const handleDeleteScene = useCallback(
    async (sceneIndex) => {
      const updatedScenes = section.scenes.filter(
        (_, index) => index !== sceneIndex
      );
      const result = await chapterActions.updateSection(
        chapterId,
        sectionIndex,
        {
          ...section,
          scenes: updatedScenes,
        }
      );
      if (result.error) {
        throw new Error(result.error);
      }
    },
    [chapterActions, chapterId, sectionIndex, section]
  );

  const handleClear = () => {
    setEditedOutline("");
  };

  const tabs = [
    {
      title: "Scenes",
      icon: FaFilm,
      content: (
        <SceneView
          scenes={section.scenes || []}
          chapterId={chapterId}
          sectionIndex={sectionIndex}
          outline={section.outline}
          onUpdateScene={handleUpdateScene}
          onDeleteScene={handleDeleteScene}
        />
      ),
    },
    {
      title: "Paragraphs",
      icon: FaParagraph,
      content: (
        <ParagraphView
          scenes={section.scenes || []}
          chapterId={chapterId}
          sectionIndex={sectionIndex}
          onUpdateScene={handleUpdateScene}
        />
        // <ParagraphView
        //   paragraphs={section.paragraphs}
        //   chapterId={chapterId}
        //   sectionIndex={sectionIndex}
        //   outline={section.outline}
        //   onRewriteParagraph={handleRewriteParagraph}
        //   onInsertParagraph={handleInsertParagraph}
        //   onDeleteParagraph={handleDeleteParagraph}
        //   onAddParagraphs={handleAddParagraphs}
        // />
      ),
    },
  ];

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
              <ClearableTextarea
                value={editedOutline}
                onChange={setEditedOutline}
                onClear={handleClear}
                placeholder={`Add outline`}
                rows={3}
              />
            ) : (
              <h3
                className={`text-xs sm:text-lg font-semibold text-gray-800 break-words transition-all duration-200 ${
                  isExpanded
                    ? "line-clamp-none"
                    : "line-clamp-1 sm:line-clamp-none"
                }`}
              >
                <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-2 min-w-[1.5em] h-[1.5em] text-xs sm:text-sm font-bold">
                  {section.paragraphs ? section.paragraphs.length : 0}
                </span>
                {section.outline}
              </h3>
            )}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEditedOutline();
                  }}
                  className="p-1 text-green-600 hover:text-green-800"
                  title="Save changes"
                >
                  <FaCheck />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEditing();
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
                    handleEditSectionOutline();
                  }}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="Edit section outline"
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
          <div className="mt-2 p-2 bg-gray-100 rounded-md flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                Summary:
              </h4>
              {section.summary && section.summary !== "" ? (
                <p
                  className="text-sm text-blue-600 cursor-pointer hover:underline"
                  onClick={openSummaryModal}
                >
                  Click to view summary
                </p>
              ) : (
                <p className="text-sm text-gray-600">No Summary Found</p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateSummary();
              }}
              className="p-1 text-green-600 hover:text-green-800"
              title={
                isSummaryLoading ? "Generating summary..." : "Generate summary"
              }
              disabled={isSummaryLoading}
            >
              {isSummaryLoading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaFileAlt />
              )}
            </button>
          </div>
          <TabSystem tabs={tabs} />
        </div>
      )}
      {error && <p className="mt-2 text-red-500">{error}</p>}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Section Summary"
      >
        <pre className="text-left whitespace-pre-wrap break-words">
          {JSON.stringify(section.summary, null, 2)}
        </pre>
      </Modal>
    </div>
  );
};

export default Section;
