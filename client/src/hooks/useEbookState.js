import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  streamContinueParagraph,
  streamRewrittenParagraph,
  streamInsertedParagraph,
} from "../server/ebook";

const initialState = {
  systemPrompts: ["You are an agent."],
  ebooks: [],
  ebookId: null,
  ebookTitle: null,
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
    setState((prevState) => ({ ...prevState, ...updates, isSaved: false }));
  };

  const ebookActions = {
    setEbookTitle: (title) => updateState({ ebookTitle: title }),
    setParameters: (parameters) =>
      updateState({
        parameters,
        ebookTitle: parameters.title || state.ebookTitle,
      }),
    createNewEbook: () => {
      const newEbook = {
        id: uuidv4(),
        title: "New Ebook",
        chapters: [],
        currentChapter: null,
        systemPrompts: [],
        parameters: {},
      };
      updateState({
        ebookId: newEbook.id,
        ebookTitle: newEbook.title,
        chapters: newEbook.chapters,
        currentChapter: newEbook.currentChapter,
        parameters: newEbook.parameters,
        ebooks: [...state.ebooks, newEbook],
      });
      localStorage.setItem("currentEbook", JSON.stringify(newEbook));
      let storedEbooks = JSON.parse(localStorage.getItem("ebooks")) || [];
      storedEbooks.push(newEbook);
      localStorage.setItem("ebooks", JSON.stringify(storedEbooks));
      return newEbook;
    },
    loadEbook: (ebookId) => {
      const foundEbook = state.ebooks.find((e) => e.id === ebookId);
      if (foundEbook) {
        updateState({
          ebookId: foundEbook.id,
          ebookTitle: foundEbook.title,
          chapters: foundEbook.chapters || [],
          currentChapter: foundEbook.currentChapter || null,
          parameters: foundEbook.parameters || {},
        });
        localStorage.setItem("currentEbook", JSON.stringify(foundEbook));
      }
    },
    deleteEbook: (ebookId) => {
      const updatedEbooks = state.ebooks.filter(
        (ebook) => ebook.id !== ebookId
      );
      updateState({ ebooks: updatedEbooks });
      localStorage.setItem("ebooks", JSON.stringify(updatedEbooks));
      if (state.ebookId === ebookId) {
        const newCurrentEbook = updatedEbooks[0] || createNewEbook();
        ebookActions.loadEbook(newCurrentEbook.id);
      }
    },
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
    continueChapter: async (
      chapterId,
      instruction,
      numParagraphs = 3,
      outlines = []
    ) => {
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
            } else {
              if (data.chunk.includes("\\n\\n")) {
                let splits = data.chunk.split("\\n\\n");
                newParagraph += splits[0] + " ";
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
                newParagraph += data.chunk + " ";
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
          numParagraphs,
          outlines,
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
    const currentEbook = {
      id: state.ebookId,
      title: state.ebookTitle,
      chapters: state.chapters,
      currentChapter: state.currentChapter,
      parameters: state.parameters,
    };
    localStorage.setItem("currentEbook", JSON.stringify(currentEbook));

    const updatedEbooks = state.ebooks.map((ebook) =>
      ebook.id === state.ebookId ? currentEbook : ebook
    );
    localStorage.setItem("ebooks", JSON.stringify(updatedEbooks));

    setState((prevState) => ({
      ...prevState,
      isSaved: true,
      ebooks: updatedEbooks,
    }));
  }, [state]);

  const loadFromLocalStorage = useCallback(() => {
    const savedCurrentEbook = JSON.parse(localStorage.getItem("currentEbook"));
    const savedEbooks = JSON.parse(localStorage.getItem("ebooks")) || [];

    if (savedEbooks.length === 0 && !savedCurrentEbook) {
      const newEbook = ebookActions.createNewEbook();
      localStorage.setItem("currentEbook", JSON.stringify(newEbook));
      localStorage.setItem("ebooks", JSON.stringify([newEbook]));
      setState({
        ...initialState,
        ebookId: newEbook.id,
        ebookTitle: newEbook.title,
        ebooks: [newEbook],
      });
    } else {
      const currentEbook =
        savedCurrentEbook || savedEbooks[0] || ebookActions.createNewEbook();
      setState({
        ...initialState,
        ebookId: currentEbook.id,
        ebookTitle: currentEbook.title,
        chapters: currentEbook.chapters || [],
        currentChapter: currentEbook.currentChapter || null,
        parameters: currentEbook.parameters || {},
        ebooks: savedEbooks,
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
