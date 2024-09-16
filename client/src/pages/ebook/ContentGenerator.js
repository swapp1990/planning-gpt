import React, { useState, useCallback } from "react";
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

  function getNextOutline(outlinesList, targetOutline) {
    const index = outlinesList.indexOf(targetOutline);
    if (index === -1) {
      console.warn(`Outline "${targetOutline}" not found in the list.`);
      return "";
    }
    if (index === outlinesList.length - 1) {
      // It's the last outline
      return "";
    }
    return outlinesList[index + 1];
  }

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

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    let prev_content = generatedContent;
    setGeneratedContent([]);
    setError(null);

    try {
      const onProgress = (intermediateResult) => {
        setGeneratedContent(intermediateResult);
      };
      const chapter = ebookState.chapters.find(
        (c) => c.id === ebookState.currentChapter
      );

      const context = {
        parameters: ebookState.parameters,
        synopsis: chapter.synopsis,
      };

      let generatedContent = [];

      if (generationType == "rewrite_paragraphs") {
        const section = chapter.sections[paraInfo.sectionId];
        context.section_paragraphs = section.paragraphs.join("\n");
        const paragraphToUpdate = paraInfo.paragraphText;
        generatedContent = await getRewrittenParagraphs(
          context,
          instruction,
          paragraphToUpdate,
          count,
          onProgress
        );
      } else if (generationType == "insert_paragraphs") {
        const section = chapter.sections[paraInfo.sectionId];
        let prev_para = paraInfo.paragraphText;
        let next_para = section.paragraphs.find(
          (_, index) => index == paraInfo.paragraphId + 1
        );
        context.section_paragraphs = section.paragraphs.join("\n");
        context.prev = prev_para;
        context.next = next_para;
        generatedContent = await getInsertedParagraphs(
          context,
          instruction,
          count,
          onProgress
        );
      } else if (generationType == "new_paragraphs") {
        const chapter = ebookState.chapters.find(
          (c) => c.id === ebookState.currentChapter
        );
        let outlinesList = chapter.sections.map((s) => s.outline);
        let next_outline = getNextOutline(outlinesList, paraInfo.outline);
        let sectionIndex = paraInfo.sectionIndex;
        let previous_summary =
          sectionIndex > 0 ? chapter.sections[sectionIndex - 1].summary : "";
        let current_summary = "";
        if (chapter.sections[sectionIndex].summary) {
          current_summary =
            sectionIndex > 0 ? chapter.sections[sectionIndex].summary : "";
        }

        const context = {
          parameters: ebookState.parameters,
          synopsis: chapter.synopsis,
          previous_summary: previous_summary,
          current_summary: current_summary,
          draft_paragraphs: prev_content.join("\n\n"),
          outline: paraInfo.outline,
          next_outline: next_outline,
        };
        generatedContent = await getNewParagraphs(
          context,
          instruction,
          count,
          onProgress
        );
      } else if (generationType == "outlines") {
        let prev_outlines = chapter.sections.map((s) => s.outline);
        let prev_summaries = chapter.sections
          .map((s) => s.summary)
          .filter((summary) => summary !== undefined);
        const context = {
          parameters: ebookState.parameters,
          chapter_synopsis: chapter.synopsis,
          previous_outlines: prev_outlines,
          previous_summaries: prev_summaries,
        };
        generatedContent = await getSuggestedOutlines(
          context,
          instruction,
          count,
          onProgress
        );
      }

      setGeneratedContent(generatedContent);
    } catch (error) {
      console.error(`Error generating ${generationType}:`, error);
      setError("Error generating content");
    }
    setIsGenerating(false);
  }, [instruction, count, generationType, ebookState]);

  const handleFinalize = useCallback(async () => {
    await onFinalize(generatedContent);
    setInstruction("");
    setGeneratedContent([]);
    setCount(1);
  }, [instruction, generatedContent]);

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
          {renderContent(generatedContent, handleEditEntry, handleDeleteEntry)}
          <div className="flex">
            <button
              onClick={handleFinalize}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
            >
              <FaPlus className="mr-2" />
              Finalize
            </button>
            <button
              onClick={handleClear}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 flex items-center"
            >
              <FaMinus className="mr-2" />
              Clear
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="mt-2">
          <p className="text-center text-sm text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ContentGenerator;
