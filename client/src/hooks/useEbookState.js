import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

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

  const resetState = (updates) => {
    console.log("initial state");
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  const ebookActions = {
    resetState: () => resetState({ ebookTitle: null, ebookId: null }),
    setEbookTitle: (title) => updateState({ ebookTitle: title }),
    setParameters: (parameters) =>
      updateState({
        parameters,
        ebookTitle: parameters.title || state.ebookTitle,
      }),
    createNewEbook: (parameters) => {
      console.log(parameters);
      const newEbook = {
        id: uuidv4(),
        title: parameters.title,
        chapters: [],
        currentChapter: null,
        systemPrompts: [],
        parameters: parameters,
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
    addSection: (chapterId, newSection) => {
      const chapterIndex = state.chapters.findIndex((c) => c.id === chapterId);
      if (chapterIndex === -1) {
        return { error: "Chapter not found" };
      }
      const chapter = state.chapters[chapterIndex];
      let currentSections = chapter.sections;
      currentSections.push(newSection);
      const updatedChapters = state.chapters.map((c, index) =>
        index === chapterIndex ? { ...c, sections: currentSections } : c
      );
      updateState({ chapters: updatedChapters });
    },
    deleteSection: (chapterId, sectionIndex) => {
      const chapterIndex = state.chapters.findIndex((c) => c.id === chapterId);
      if (chapterIndex === -1) {
        console.error(`Chapter with id ${chapterId} not found`);
        return { error: "Chapter not found" };
      }
      const chapter = state.chapters[chapterIndex];
      if (sectionIndex < 0 || sectionIndex >= chapter.sections.length) {
        console.error(`Invalid section index: ${sectionIndex}`);
        return { error: "Invalid section index" };
      }
      const updatedSections = [
        ...chapter.sections.slice(0, sectionIndex),
        ...chapter.sections.slice(sectionIndex + 1),
      ];
      const updatedChapters = state.chapters.map((c, index) =>
        index === chapterIndex ? { ...c, sections: updatedSections } : c
      );

      updateState({ chapters: updatedChapters });
      return { success: true };
    },
    updateSection: (chapterId, sectionIndex, updatedSection) => {
      const chapterIndex = state.chapters.findIndex((c) => c.id === chapterId);
      if (chapterIndex === -1) {
        console.error(`Chapter with id ${chapterId} not found`);
        return { error: "Chapter not found" };
      }
      const chapter = state.chapters[chapterIndex];
      if (sectionIndex < 0 || sectionIndex >= chapter.sections.length) {
        console.error(`Invalid section index: ${sectionIndex}`);
        return { error: "Invalid section index" };
      }
      const updatedSections = chapter.sections.map((section, index) =>
        index === sectionIndex ? { ...section, ...updatedSection } : section
      );
      const updatedChapters = state.chapters.map((c, index) =>
        index === chapterIndex ? { ...c, sections: updatedSections } : c
      );

      updateState({ chapters: updatedChapters });
      return { success: true };
    },
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
      // const newEbook = ebookActions.createNewEbook();
      // localStorage.setItem("currentEbook", JSON.stringify(newEbook));
      // localStorage.setItem("ebooks", JSON.stringify([newEbook]));
      // setState({
      //   ...initialState,
      //   ebookId: newEbook.id,
      //   ebookTitle: newEbook.title,
      //   ebooks: [newEbook],
      // });
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
