import { useReducer, useCallback, useEffect } from "react";
// import { useChapters } from "./useChapters";
// import { useParameters } from "./useParameters";
// import { useApi } from "./useApi";

const initialState = {
  ebookTitle: "Ebbok",
  chapters: [],
  currentChapter: null,
  parameters: {},
  isSaved: true,
  isSidebarOpen: false,
  isEditingTitle: false,
  isEbookListOpen: false,
};

const createSlice = (initialState) => {
  const reducers = {};
  const actions = {};

  const addReducer = (name, reducer) => {
    reducers[name] = reducer;
    actions[name] = (payload) => ({ type: name, payload });
  };

  const combinedReducer = (state, action) => {
    const reducer = reducers[action.type];
    return reducer ? reducer(state, action.payload) : state;
  };

  return { addReducer, actions, reducer: combinedReducer, initialState };
};

const {
  addReducer,
  actions,
  reducer,
  initialState: sliceInitialState,
} = createSlice(initialState);

// Define reducers and automatically create corresponding actions
addReducer("setEbookTitle", (state, title) => ({
  ...state,
  ebookTitle: title,
  isSaved: false,
}));
addReducer("setChapters", (state, chapters) => ({ ...state, chapters }));
addReducer("setCurrentChapter", (state, currentChapter) => ({
  ...state,
  currentChapter,
}));
addReducer("setParameters", (state, parameters) => ({
  ...state,
  parameters,
  ebookTitle: parameters.title || state.ebookTitle,
  isSaved: false,
}));
addReducer("setIsSaved", (state, isSaved) => ({ ...state, isSaved }));
addReducer("toggleSidebar", (state) => ({
  ...state,
  isSidebarOpen: !state.isSidebarOpen,
}));
addReducer("toggleEditTitle", (state) => ({
  ...state,
  isEditingTitle: !state.isEditingTitle,
}));
addReducer("toggleEbookList", (state) => ({
  ...state,
  isEbookListOpen: !state.isEbookListOpen,
}));
addReducer("loadState", (state, loadedState) => ({
  ...state,
  ...loadedState,
}));

export function useEbookState() {
  const [state, dispatch] = useReducer(reducer, sliceInitialState);
  // const { chapterActions } = useChapters(state, dispatch);
  // const { parameterActions } = useParameters(state, dispatch);
  // const api = useApi();

  const createAction = (actionName) =>
    useCallback(
      (payload) => dispatch(actions[actionName](payload)),
      [dispatch]
    );

  const ebookActions = {
    setEbookTitle: createAction("setEbookTitle"),
    setIsSaved: createAction("setIsSaved"),
    setParameters: createAction("setParameters"),
  };

  const uiActions = {
    toggleSidebar: createAction("toggleSidebar"),
    toggleEditTitle: createAction("toggleEditTitle"),
    toggleEbookList: createAction("toggleEbookList"),
  };

  const saveToLocalStorage = useCallback(() => {
    const dataToSave = {
      title: state.ebookTitle,
      chapters: state.chapters,
      parameters: state.parameters,
      // Add any other fields you want to save
    };

    localStorage.setItem("currentEbook", JSON.stringify(dataToSave));

    // Update the ebooks list
    let savedEbooks = localStorage.getItem("ebooks");
    if (savedEbooks) {
      savedEbooks = JSON.parse(savedEbooks);
    } else {
      savedEbooks = [];
    }

    const existingEbookIndex = savedEbooks.findIndex(
      (ebook) => ebook.title === state.ebookTitle
    );

    if (existingEbookIndex !== -1) {
      savedEbooks[existingEbookIndex] = {
        title: state.ebookTitle,
        bookData: dataToSave,
      };
    } else {
      savedEbooks.push({
        title: state.ebookTitle,
        bookData: dataToSave,
      });
    }

    localStorage.setItem("ebooks", JSON.stringify(savedEbooks));
    dispatch(actions.setIsSaved(true));
  }, [state, dispatch]);

  const loadFromLocalStorage = useCallback((ebookToLoad = null) => {
    console.log("loadFromLocalStorage " + ebookToLoad);
    const savedData = localStorage.getItem("currentEbook");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      dispatch(
        actions.loadState({
          ebookTitle: parsedData.title || "Untitled Ebook",
          chapters: parsedData.chapters || [],
          currentChapter: parsedData.currentChapter || null,
          parameters: parsedData.parameters || [],
          // Add other fields as necessary
        })
      );
    }
  });

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  useEffect(() => {
    if (!state.isSaved) {
      saveToLocalStorage();
    }
  }, [state, saveToLocalStorage]);

  return {
    ebookState: state,
    ebookActions,
    uiActions,
    // chapterActions,
    // parameterActions,
    // api,
  };
}
