import { streamedApiCall, regularApiCall } from "../utils/api";

export const streamInsertedParagraph = async (
  ebookState,
  chapterId,
  paragraphIndex,
  instruction,
  onChunk,
  onError
) => {
  const { chapters, parameters, systemPrompts } = ebookState;
  console.log("streamInsertedParagraph");
  const chapter = chapters.find((c) => c.id === chapterId);
  const chapterIndex = chapters.findIndex((c) => c.id === chapterId);
  const paragraphs = chapter.content;
  let paragraph = paragraphs[paragraphIndex];
  try {
    await streamedApiCall(
      `${process.env.REACT_APP_API_URL}/chapter/insert`,
      "POST",
      {
        paragraph: paragraph,
        synopsis: chapter.synopsis,
        previousParagraph: paragraphs[paragraphs.length - 1],
        systemPrompt: systemPrompts[0],
        instruction: instruction,
      },
      onChunk,
      onError
    );
  } catch (error) {
    throw new Error(error);
  }
};

export const streamRewrittenParagraph = async (
  ebookState,
  chapterId,
  paragraphIndex,
  instruction,
  onChunk,
  onError
) => {
  const { chapters, parameters, systemPrompts } = ebookState;
  console.log("streamRewrittenParagraph");
  const chapter = chapters.find((c) => c.id === chapterId);
  const chapterIndex = chapters.findIndex((c) => c.id === chapterId);
  const paragraphs = chapter.content;
  let paragraph = paragraphs[paragraphIndex];
  try {
    await streamedApiCall(
      `${process.env.REACT_APP_API_URL}/chapter/rewrite`,
      "POST",
      {
        paragraph: paragraph,
        synopsis: chapter.synopsis,
        previousParagraph: paragraphs[paragraphs.length - 1],
        systemPrompt: systemPrompts[0],
        instruction: instruction,
      },
      onChunk,
      onError
    );
  } catch (error) {
    throw new Error(error);
  }
};

export const streamContinueParagraph = async (
  ebookState,
  chapterId,
  instruction,
  onChunk,
  onError
) => {
  const { chapters, parameters, systemPrompts } = ebookState;
  console.log("streamContinueParagraph");
  if (!systemPrompts || systemPrompts.length === 0) {
    throw new Error("System Prompts is empty");
  }

  const chapter = chapters.find((c) => c.id === chapterId);
  const chapterIndex = chapters.findIndex((c) => c.id === chapterId);
  const paragraphs = chapter.content;

  const previousChaptersSynopsis = chapters
    .slice(0, chapterIndex)
    .map(
      (chapter, index) =>
        `Chapter ${index + 1}: ${chapter.title}\n${chapter.synopsis}`
    )
    .join("\n\n");

  try {
    await streamedApiCall(
      `${process.env.REACT_APP_API_URL}/chapter/continue`,
      "POST",
      {
        parameters: parameters,
        synopsis: chapter.synopsis,
        previousChapters: previousChaptersSynopsis,
        previousParagraph: paragraphs[paragraphs.length - 1],
        systemPrompt: systemPrompts[0],
        instruction: instruction,
      },
      onChunk,
      onError
    );
  } catch (error) {
    throw new Error(error);
  }
};

export const getSugggestedText = async (fieldType, current_value, context) => {
  try {
    const response = await regularApiCall(
      `${process.env.REACT_APP_API_URL}/parameters/suggestions`,
      "POST",
      {
        fieldType: fieldType,
        current_value: current_value,
        context: context,
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }
    // console.log(response);
    let text = JSON.parse(response.suggestions).text;
    // console.log(text);
    return text;
  } catch (error) {
    throw new Error(error);
  }
};
