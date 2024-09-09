import { useState, useEffect, useCallback } from "react";
import {
  streamContinueParagraph,
  streamRewrittenParagraph,
  streamInsertedParagraph,
} from "../server/ebook";

const initialState = {
  systemPrompts: ["You are an agent."],
  ebookTitle: "Ebook",
  chapters: [],
  currentChapter: null,
  parameters: {},
  isSaved: true,
  isSidebarOpen: false,
  isEditingTitle: false,
  isEbookListOpen: false,
};

export function useEbookState() {
  const [state, setState] = useState(initialState);

  const updateState = (updates) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  const ebookActions = {
    setEbookTitle: (title) => updateState({ ebookTitle: title }),
    setParameters: (parameters) =>
      updateState({
        parameters,
        ebookTitle: parameters.title || state.ebookTitle,
      }),
  };

  const chapterActions = {
    addChapter: (newChapter) =>
      updateState({
        chapters: [...state.chapters, newChapter],
      }),
    updateChapter: (chapterId, updatedChapter) =>
      updateState({
        chapters: state.chapters.map((ch) =>
          ch.id === chapterId ? { ...ch, ...updatedChapter } : ch
        ),
      }),
    updateChapterTitle: (chapterId, updatedTitle) =>
      updateState({
        chapters: state.chapters.map((ch) =>
          ch.id === chapterId ? { ...ch, title: updatedTitle } : ch
        ),
      }),
    deleteChapter: (chapterId) =>
      updateState({
        chapters: state.chapters.filter((ch) => ch.id !== chapterId),
        currentChapter:
          state.currentChapter === chapterId ? null : state.currentChapter,
      }),
    deleteParagraph: (chapterId, paragraphIndex) => {
      const chapterIndex = state.chapters.findIndex((c) => c.id === chapterId);
      if (chapterIndex === -1) {
        console.error(`Chapter with id ${chapterId} not found`);
        return { error: "Chapter not found" };
      }
      const chapter = state.chapters[chapterIndex];
      if (paragraphIndex < 0 || paragraphIndex >= chapter.content.length) {
        console.error(`Invalid paragraph index: ${paragraphIndex}`);
        return { error: "Invalid paragraph index" };
      }
      const updatedParagraphs = [
        ...chapter.content.slice(0, paragraphIndex),
        ...chapter.content.slice(paragraphIndex + 1),
      ];
      const updatedChapters = state.chapters.map((c, index) =>
        index === chapterIndex ? { ...c, content: updatedParagraphs } : c
      );

      updateState({ chapters: updatedChapters });
      return { success: true };
    },
    continueChapter: async (chapterId, instruction) => {
      let newParagraph = "";
      let newParagraphs = [];
      const chapterIndex = state.chapters.findIndex((c) => c.id === chapterId);
      if (chapterIndex === -1) {
        return { error: "Chapter not found" };
      }

      try {
        const onChunk = (data) => {
          if (data.chunk) {
            if (data.chunk === "[DONE]") {
              // const chapter = state.chapters[chapterIndex];
              // let updatedParagraphs = [...chapter.content, ...newParagraphs];
              // // console.log(updatedParagraphs);
              // const updatedChapters = state.chapters.map((c, index) =>
              //   index === chapterIndex
              //     ? { ...c, content: updatedParagraphs }
              //     : c
              // );
              // // console.log(updatedChapters);
              // updateState({ chapters: updatedChapters });
            } else {
              if (data.chunk.includes("\\n\\n")) {
                let splits = data.chunk.split("\\n\\n");
                newParagraph += splits[0];
                const chapter = state.chapters[chapterIndex];
                let currentParagraphs = chapter.content;
                if (!currentParagraphs[currentParagraphs.length]) {
                  currentParagraphs[currentParagraphs.length] = newParagraph;
                } else {
                  currentParagraphs[currentParagraphs.length] += newParagraph;
                }

                // console.log(currentParagraphs);
                const updatedChapters = state.chapters.map((c, index) =>
                  index === chapterIndex
                    ? { ...c, content: currentParagraphs }
                    : c
                );
                updateState({ chapters: updatedChapters });
                newParagraphs.push(newParagraph);
                newParagraph = splits[1];
              } else {
                newParagraph += data.chunk;
                const chapter = state.chapters[chapterIndex];
                let updatedParagraphs = [...chapter.content, newParagraph];
                // console.log(updatedParagraphs);
                const updatedChapters = state.chapters.map((c, index) =>
                  index === chapterIndex
                    ? { ...c, content: updatedParagraphs }
                    : c
                );
                updateState({ chapters: updatedChapters });
              }
            }
          }
        };
        const onError = (error) => {
          console.error("Error fetching continue chapter response:", error);
          throw new Error(error.message || "Error from server");
        };
        await streamContinueParagraph(
          state,
          chapterId,
          instruction,
          onChunk,
          onError
        );
        return { newParagraph };
      } catch (error) {
        console.log(error);
        return { error: error.message };
      }
    },
    rewriteParagraph: async (chapterId, paragraphIndex, instruction) => {
      const chapterIndex = state.chapters.findIndex((c) => c.id === chapterId);
      if (chapterIndex === -1) {
        return { error: "Chapter not found" };
      }
      let newParagraph = "";
      try {
        const onChunk = (data) => {
          if (data.chunk) {
            if (data.chunk !== "[DONE]") {
              newParagraph += data.chunk + " ";
            } else {
              // console.log(newParagraph);
            }
          }
        };
        const onError = (error) => {
          console.error("Error fetching rewritten paragraph response:", error);
          throw new Error(error.message || "Error from server");
        };
        await streamRewrittenParagraph(
          state,
          chapterId,
          paragraphIndex,
          instruction,
          onChunk,
          onError
        );
        return { newParagraph };
      } catch (error) {
        console.log(error);
        return { error: error.message };
      }
    },
    insertParagraph: async (chapterId, paragraphIndex, instruction) => {
      const chapterIndex = state.chapters.findIndex((c) => c.id === chapterId);
      if (chapterIndex === -1) {
        return { error: "Chapter not found" };
      }
      const chapter = state.chapters[chapterIndex];
      if (paragraphIndex < 0 || paragraphIndex >= chapter.content.length) {
        return { error: "Invalid paragraph index" };
      }
      let newParagraph = "";
      try {
        const onChunk = (data) => {
          if (data.chunk) {
            if (data.chunk !== "[DONE]") {
              newParagraph += data.chunk + " ";
              updateState({
                chapters: state.chapters.map((c, index) =>
                  index === chapterIndex
                    ? {
                        ...c,
                        content: [
                          ...c.content.slice(0, paragraphIndex),
                          newParagraph.trim(),
                          ...c.content.slice(paragraphIndex),
                        ],
                        streaming: true,
                      }
                    : c
                ),
              });
            } else {
              updateState({
                chapters: state.chapters.map((c, index) =>
                  index === chapterIndex
                    ? {
                        ...c,
                        content: [
                          ...c.content.slice(0, paragraphIndex),
                          newParagraph.trim(),
                          ...c.content.slice(paragraphIndex),
                        ],
                        streaming: false,
                      }
                    : c
                ),
              });
            }
          }
        };
        const onError = (error) => {
          console.error("Error fetching rewritten paragraph response:", error);
          throw new Error(error.message || "Error from server");
        };
        await streamInsertedParagraph(
          state,
          chapterId,
          paragraphIndex,
          instruction,
          onChunk,
          onError
        );
        return { newParagraph };
      } catch (error) {
        console.log(error);
        return { error: error.message };
      }
    },
    applyRewrite: (chapterId, paragraphIndex, newContent) => {
      console.log("applyRewrite");
      const chapterIndex = state.chapters.findIndex((c) => c.id === chapterId);
      if (chapterIndex === -1) {
        return { error: "Chapter not found" };
      }

      const chapter = state.chapters[chapterIndex];
      if (paragraphIndex < 0 || paragraphIndex >= chapter.content.length) {
        return { error: "Invalid paragraph index" };
      }
      updateState({
        chapters: state.chapters.map((c, index) =>
          index === chapterIndex
            ? {
                ...c,
                content: c.content.map((paragraph, pIndex) =>
                  pIndex === paragraphIndex ? newContent.trim() : paragraph
                ),
                streaming: false,
              }
            : c
        ),
      });
    },
    setCurrentChapter: (chapterId) =>
      updateState({ currentChapter: chapterId }),
  };

  const uiActions = {
    toggleSidebar: () => updateState({ isSidebarOpen: !state.isSidebarOpen }),
    toggleEditTitle: () =>
      updateState({ isEditingTitle: !state.isEditingTitle }),
    toggleEbookList: () =>
      updateState({ isEbookListOpen: !state.isEbookListOpen }),
  };

  const saveToLocalStorage = useCallback(() => {
    const dataToSave = {
      title: state.ebookTitle,
      chapters: state.chapters,
      parameters: state.parameters,
    };

    localStorage.setItem("currentEbook", JSON.stringify(dataToSave));

    let savedEbooks = JSON.parse(localStorage.getItem("ebooks") || "[]");
    const existingEbookIndex = savedEbooks.findIndex(
      (ebook) => ebook.title === state.ebookTitle
    );

    if (existingEbookIndex !== -1) {
      savedEbooks[existingEbookIndex] = {
        title: state.ebookTitle,
        bookData: dataToSave,
      };
    } else {
      savedEbooks.push({ title: state.ebookTitle, bookData: dataToSave });
    }

    localStorage.setItem("ebooks", JSON.stringify(savedEbooks));
    setState((prevState) => ({ ...prevState, isSaved: true }));
  }, [state]);

  const loadFromLocalStorage = useCallback((ebookToLoad = null) => {
    const savedData = localStorage.getItem("currentEbook");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setState({
        ...initialState,
        ebookTitle: parsedData.title || "Untitled Ebook",
        chapters: parsedData.chapters || [],
        currentChapter: parsedData.currentChapter || null,
        parameters: parsedData.parameters || {},
      });
    }
  }, []);

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  useEffect(() => {
    if (!state.isSaved) {
      saveToLocalStorage();
    }
  }, [state, saveToLocalStorage]);

  return {
    ebookState: state,
    ebookActions,
    chapterActions,
    uiActions,
  };
}
