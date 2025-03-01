import React, { useState, useCallback, useEffect } from "react";
import { FaPlus, FaTimes, FaMinus } from "react-icons/fa";
import GenerationMenu from "./GenerationMenu";
import {
  getNewParagraphs,
  getNewSceneParagraphs,
  getInsertedParagraphs,
  getRewrittenParagraphs,
  getSuggestedOutlines,
  getGeneratedScene,
  getRewrittenScene,
  getContinuedScene,
  getInsertedScene,
} from "../../server/ebook";
import { useEbook } from "../../context/EbookContext";

const ContentGenerator = ({
  paraInfo,
  onFinalize,
  onClose,
  onStarted,
  onProgress,
  onFinished,
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
      paragraph: paraInfo.paragraphText,
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

  const convertSceneToScreenplayText = (scene) => {
    let sceneText = [];
    sceneText.push(`TITLE: ${scene.title}`);
    // Scene heading
    sceneText.push(
      `INT. ${scene.setting.location.toUpperCase()} - ${scene.setting.time.toUpperCase()}`
    );
    sceneText.push("");

    // Scene description
    sceneText.push(scene.setting.description);
    sceneText.push("");

    // Scene elements
    scene.elements.forEach((element) => {
      switch (element.type) {
        case "action":
          sceneText.push(element.description);
          sceneText.push("");
          break;
        case "dialogue":
          if (element.character) {
            sceneText.push(element.character.toUpperCase());
          }

          if (element.parenthetical) {
            sceneText.push(`(${element.parenthetical})`);
          }
          sceneText.push(element.line);
          sceneText.push("");
          break;
        case "internal_monologue":
          sceneText.push(element.description);
          sceneText.push("");
          break;
        case "transition":
          sceneText.push(element.description.toUpperCase());
          sceneText.push("");
          break;
        default:
          console.warn(`Unknown element type: ${element.type}`);
      }
    });

    // Join all lines with newline characters
    return sceneText.join("\n");
  };

  const prepareNewParagraphsContext = (chapter, paraInfo, baseContext) => {
    const sectionIndex = paraInfo.sectionIndex;
    const current_scene =
      chapter.sections[sectionIndex].scenes[paraInfo.sceneIndex] || "";

    const screenplayText = convertSceneToScreenplayText(current_scene);

    return {
      ...baseContext,
      current_screenplay: screenplayText,
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

  const prepareNewSceneContext = (chapter, paraInfo, baseContext) => {
    let previous_summary = "";
    if (paraInfo.sectionIndex != 0) {
      previous_summary = chapter.sections[paraInfo.sectionIndex - 1].summary;
    }
    const current_scenes = chapter.sections[paraInfo.sectionIndex].scenes || [];
    let previous_screenplay = "";
    let previous_scene = null;
    if (current_scenes.length > 0) {
      previous_scene = current_scenes[current_scenes.length - 1];
    }
    if (previous_scene != null) {
      previous_screenplay = convertSceneToScreenplayText(previous_scene);
    }
    // console.log(previous_screenplay);
    // console.log({ previous_summary });
    return {
      ...baseContext,
      overall_outline: paraInfo.outline,
      previous_summary: previous_summary,
      previous_screenplay: previous_screenplay,
    };
  };

  const prepareRewriteSceneContext = (chapter, paraInfo, baseContext) => {
    let previous_summary = "";
    if (paraInfo.sectionIndex != 0) {
      previous_summary = chapter.sections[paraInfo.sectionIndex - 1].summary;
    }
    const screenplayText = convertSceneToScreenplayText(paraInfo.scene);
    return {
      ...baseContext,
      current_screenplay: screenplayText,
      previous_summary: previous_summary,
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
          new_scene: () =>
            prepareNewSceneContext(chapter, paraInfo, baseContext),
          rewrite_scene: () =>
            prepareRewriteSceneContext(chapter, paraInfo, baseContext),
          continue_scene: () =>
            prepareRewriteSceneContext(chapter, paraInfo, baseContext),
          outlines: () => prepareOutlinesContext(chapter, baseContext),
          inserted_scene: () => baseContext,
        };

        const context = contextPreparation[generationType]();

        let generatedContent = [];
        if (generationType === "rewrite_paragraphs") {
          const onRewriteProgress = (intermediateResult) => {
            let generatedContent = [...intermediateResult];
            setGeneratedContent(generatedContent);
          };

          generatedContent = await getRewrittenParagraphs(
            context,
            instruction,
            count,
            onRewriteProgress,
            isRetry,
            true
          );
        } else {
          const handleProgress = (intermediateResult) => {
            setGeneratedContent(intermediateResult);
          };
          if (generationType == "new_paragraphs") {
            generatedContent = await getNewSceneParagraphs(
              context,
              instruction,
              count,
              handleProgress,
              isRetry,
              true
            );
          } else if (generationType == "insert_paragraphs") {
            generatedContent = await getInsertedParagraphs(
              context,
              instruction,
              count,
              handleProgress,
              isRetry,
              true
            );
          } else if (generationType == "outlines") {
            generatedContent = await getSuggestedOutlines(
              context,
              instruction,
              count,
              handleProgress
            );
          } else if (generationType == "new_scene") {
            onStarted();
            setGeneratedContent([]);
            generatedContent = await getGeneratedScene(
              context,
              instruction,
              count,
              onProgress,
              true
            );
            console.log(generatedContent);
            onFinished(generatedContent);
          } else if (generationType == "rewrite_scene") {
            onStarted();
            setGeneratedContent([]);
            generatedContent = await getRewrittenScene(
              context,
              instruction,
              count,
              onProgress,
              true
            );
            onFinished(generatedContent);
          } else if (generationType == "continue_scene") {
            onStarted();
            setGeneratedContent([]);
            generatedContent = await getContinuedScene(
              context,
              instruction,
              count,
              onProgress,
              true
            );
            onFinished(generatedContent);
          } else if (generationType == "inserted_scene") {
            onStarted();
            setGeneratedContent([]);
            generatedContent = await getInsertedScene(
              context,
              instruction,
              count,
              onProgress,
              true
            );
            onFinished(generatedContent);
          }
        }
        setGeneratedContent(generatedContent);
      } catch (error) {
        console.error(`Error generating ${generationType}:`, error);
        setError("Error generating content");
        onFinished([]);
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
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
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
          {renderContent(generatedContent)}
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
