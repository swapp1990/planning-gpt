import React, { useState, useCallback, useEffect } from "react";
import { FaPlus, FaTimes, FaMinus } from "react-icons/fa";
import GenerationMenu from "./GenerationMenu";
import {
  getNewParagraphs,
  getInsertedParagraphs,
  getRewrittenParagraphs,
  getSuggestedOutlines,
} from "../../server/ebook";
import { useEbook } from "../../context/EbookContext";

const ContentGenerator = ({
  paraInfo,
  onFinalize,
  onClose,
  renderContent,
  generationType = "paragraphs",
  title = "Generate new paragraphs",
}) => {
  const [instruction, setInstruction] = useState("");
  const [count, setCount] = useState(1);
  const [generatedContent, setGeneratedContent] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const { ebookState } = useEbook();

  const prepareRewriteContext = (chapter, paraInfo, baseContext) => {
    const section = chapter.sections[paraInfo.sectionId];
    let prev_para, next_para;

    if (paraInfo.paragraphId > 0) {
      prev_para = section.paragraphs[paraInfo.paragraphId - 1];
    } else {
      const prevSectionId = paraInfo.sectionId - 1;
      if (prevSectionId >= 0 && chapter.sections[prevSectionId]) {
        const prevSection = chapter.sections[prevSectionId];
        prev_para = prevSection.paragraphs[prevSection.paragraphs.length - 1];
      } else {
        prev_para = null;
      }
    }

    next_para = section.paragraphs.find(
      (_, index) => index === paraInfo.paragraphId + 1
    );

    return {
      ...baseContext,
      previous_paragraph: prev_para,
      next_paragraph: next_para,
      paragraph_to_update: paraInfo.paragraphText,
    };
  };

  const prepareInsertContext = (chapter, paraInfo, baseContext) => {
    const section = chapter.sections[paraInfo.sectionId];
    const prev_para = paraInfo.paragraphText;
    const next_para = section.paragraphs.find(
      (_, index) => index === paraInfo.paragraphId + 1
    );

    return {
      ...baseContext,
      prev: prev_para,
      next: next_para,
    };
  };

  const prepareNewParagraphsContext = (chapter, paraInfo, baseContext) => {
    const outlinesList = chapter.sections.map((s) => s.outline);
    const next_outline = getNextOutline(outlinesList, paraInfo.outline);
    const sectionIndex = paraInfo.sectionIndex;
    const previous_summary =
      sectionIndex > 0 ? chapter.sections[sectionIndex - 1].summary : "";
    const current_summary = chapter.sections[sectionIndex].summary || "";

    let previous_paragraph =
      chapter.sections[sectionIndex].paragraphs?.slice(-1)[0] ||
      chapter.sections[sectionIndex - 1]?.paragraphs?.slice(-1)[0] ||
      "";

    return {
      ...baseContext,
      previous_summary,
      current_summary,
      outline: paraInfo.outline,
      next_outline,
      previous_paragraph: previous_paragraph,
    };
  };

  const prepareOutlinesContext = (chapter, baseContext) => {
    const prev_outlines = chapter.sections.map((s) => s.outline);
    const prev_summaries = chapter.sections
      .map((s) => s.summary)
      .filter((summary) => summary !== undefined);

    return {
      ...baseContext,
      chapter_synopsis: chapter.synopsis,
      previous_outlines: prev_outlines,
      previous_summaries: prev_summaries,
    };
  };

  // Helper function to get the next outline
  const getNextOutline = (outlinesList, targetOutline) => {
    const index = outlinesList.indexOf(targetOutline);
    if (index === -1 || index === outlinesList.length - 1) {
      return "";
    }
    return outlinesList[index + 1];
  };

  const handleEditEntry = useCallback((index, newText) => {
    setGeneratedContent((prevContent) =>
      prevContent.map((item, i) =>
        i === index ? { ...item, outline: newText } : item
      )
    );
  }, []);

  const handleDeleteEntry = useCallback((index) => {
    setGeneratedContent((prevContent) =>
      prevContent.filter((_, i) => i !== index)
    );
  }, []);

  useEffect(() => {
    // console.log(generatedContent);
  }, [generatedContent]);

  const handleGeneration = useCallback(
    async (isRetry = false) => {
      setIsGenerating(true);
      setGeneratedContent([]);
      setError(null);

      try {
        const chapter = ebookState.chapters.find(
          (c) => c.id === ebookState.currentChapter
        );

        const baseContext = {
          parameters: ebookState.parameters,
          synopsis: chapter.synopsis,
        };

        const contextPreparation = {
          rewrite_paragraphs: () =>
            prepareRewriteContext(chapter, paraInfo, baseContext),
          insert_paragraphs: () =>
            prepareInsertContext(chapter, paraInfo, baseContext),
          new_paragraphs: () =>
            prepareNewParagraphsContext(chapter, paraInfo, baseContext),
          outlines: () => prepareOutlinesContext(chapter, baseContext),
        };

        const context = contextPreparation[generationType]();

        let generatedContent = [];
        if (generationType === "rewrite_paragraphs") {
          const paragraphToUpdate = paraInfo.paragraphText;

          const onRewriteProgress = (intermediateResult) => {
            let generatedContent = [...intermediateResult];
            setGeneratedContent(generatedContent);
          };

          generatedContent = await getRewrittenParagraphs(
            context,
            instruction,
            paragraphToUpdate,
            count,
            onRewriteProgress,
            isRetry
          );
        } else {
          const onProgress = (intermediateResult) => {
            setGeneratedContent(intermediateResult);
          };
          if (generationType == "insert_paragraphs") {
            generatedContent = await getInsertedParagraphs(
              context,
              instruction,
              count,
              onProgress,
              isRetry
            );
          } else if (generationType == "new_paragraphs") {
            generatedContent = await getNewParagraphs(
              context,
              instruction,
              count,
              onProgress,
              isRetry
            );
          } else if (generationType == "outlines") {
            generatedContent = await getSuggestedOutlines(
              context,
              instruction,
              count,
              onProgress
            );
          }
        }
        setGeneratedContent(generatedContent);
      } catch (error) {
        console.error(`Error generating ${generationType}:`, error);
        setError("Error generating content");
      }
      setIsGenerating(false);
    },
    [instruction, count, generationType, ebookState]
  );

  const handleGenerate = useCallback(
    () => handleGeneration(false),
    [handleGeneration]
  );
  const handleRetry = useCallback(
    () => handleGeneration(true),
    [handleGeneration]
  );

  const handleFinalize = useCallback(async () => {
    let finalContent;
    const isActionBasedContent =
      generatedContent.length > 0 &&
      typeof generatedContent[0] === "object" &&
      "action" in generatedContent[0];

    if (isActionBasedContent) {
      // Process content with actions
      let paragraphs = [];
      let currentParagraph = "";

      generatedContent.forEach((item) => {
        switch (item.action) {
          case "edit":
          case "add":
            currentParagraph += item.rewritten_sentence + " ";
            break;
          case "remove":
            // Skip removed sentences
            break;
          case "paragraph_break":
            if (currentParagraph.trim()) {
              paragraphs.push(currentParagraph.trim());
              currentParagraph = "";
            }
            break;
          default:
            currentParagraph += (item.original_sentence || "") + " ";
        }
      });

      // Add the last paragraph if it's not empty
      if (currentParagraph.trim()) {
        paragraphs.push(currentParagraph.trim());
      }

      finalContent = paragraphs;
    } else {
      finalContent = generatedContent;
    }

    await onFinalize(finalContent);
    setInstruction("");
    setGeneratedContent([]);
    setCount(1);
  }, [generatedContent, onFinalize, setGeneratedContent]);

  const handleClear = useCallback(async () => {
    setGeneratedContent([]);
    setCount(1);
  }, [instruction, generatedContent]);

  return (
    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-md font-semibold text-yellow-700">{title}</h4>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-red-500 transition-colors duration-200"
          aria-label={`Close generated ${generationType}`}
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>

      <GenerationMenu
        instruction={instruction}
        setInstruction={setInstruction}
        count={count}
        setCount={setCount}
        onGenerate={handleGenerate}
        isLoading={isGenerating}
        generationType={generationType}
      />

      {generatedContent.length > 0 && (
        <>
          {!isGenerating && (
            <div className="flex mb-4">
              <button
                onClick={handleFinalize}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
              >
                <FaPlus className="mr-2" />
                Finalize
              </button>
              <button
                onClick={handleClear}
                className="ml-2 mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 flex items-center"
              >
                <FaMinus className="mr-2" />
                Clear
              </button>
            </div>
          )}
          {renderContent(generatedContent, handleEditEntry, handleDeleteEntry)}
        </>
      )}

      {error && (
        <div className="mt-2 flex justify-center">
          <p className="text-center text-sm text-red-500">{error}</p>
          <button
            onClick={handleRetry}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentGenerator;
