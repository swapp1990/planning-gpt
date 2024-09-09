import { streamedApiCall } from "../utils/api";

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
