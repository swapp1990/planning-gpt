import { useState, useCallback, useEffect } from "react";

export const useEbookStorage = () => {
  const [ebookTitle, setEbookTitle] = useState("My Ebook Title");
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [systemPrompts, setSystemPrompts] = useState([]);
  const [parameters, setParameters] = useState({});
  const [ebooks, setEbooks] = useState([]);
  const [isSaved, setIsSaved] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  const saveToLocalStorage = useCallback(() => {
    const bookData = {
      title: ebookTitle,
      chapters,
      currentChapter,
      systemPrompts,
      parameters,
    };

    // Save current ebook
    localStorage.setItem("currentEbook", JSON.stringify(bookData));

    // Update ebooks list
    const updatedEbooks = ebooks.filter((ebook) => ebook.title !== ebookTitle);
    if (ebookTitle !== "New Ebook") {
      updatedEbooks.push({
        title: ebookTitle,
        lastModified: new Date().toISOString(),
        bookData: bookData,
      });
      localStorage.setItem("ebooks", JSON.stringify(updatedEbooks));
      setEbooks(updatedEbooks);
    }

    setIsSaved(true);
    setLastSavedTime(new Date().toLocaleTimeString());
  }, [chapters, currentChapter, systemPrompts, parameters, ebookTitle, ebooks]);

  const loadFromLocalStorage = useCallback((ebookToLoad = null) => {
    if (ebookToLoad) {
      if (localStorage.getItem("ebooks")) {
        let storedEbooks = JSON.parse(localStorage.getItem("ebooks"));
        let resp = storedEbooks.filter((ebook) => ebook.title === ebookToLoad);
        if (resp && resp.length > 0) {
          let loadedEbook = resp[0];
          const parsedData = loadedEbook.bookData;
          setEbookTitle(parsedData.parameters.title || "Untitled");
          setChapters(parsedData.chapters || []);
          setCurrentChapter(parsedData.currentChapter || null);
          setSystemPrompts(parsedData.systemPrompts || []);
          setParameters(parsedData.parameters || []);
        }
      }
    } else {
      const savedData = localStorage.getItem("currentEbook");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setEbookTitle(parsedData.title || "Untitled Ebook");
        setChapters(parsedData.chapters || []);
        setCurrentChapter(parsedData.currentChapter || null);
        setSystemPrompts(parsedData.systemPrompts || []);
        setParameters(parsedData.parameters || []);
      }
    }

    // Load ebooks list
    let savedEbooks = localStorage.getItem("ebooks");
    if (savedEbooks) {
      savedEbooks = JSON.parse(savedEbooks);
      setEbooks(savedEbooks);
    }
  }, []);

  const createNewEbook = () => {
    const newEbookTitle = "New Ebook";
    const newEbook = {
      title: newEbookTitle,
      chapters: [],
      currentChapter: null,
      systemPrompts: [],
      parameters: [],
    };

    // Save current ebook
    localStorage.setItem("currentEbook", JSON.stringify(newEbook));

    // Load the new ebook
    loadFromLocalStorage();
  };

  const deleteEbook = (ebookTitleToDelete) => {
    // Update ebooks list
    const updatedEbooks = ebooks.filter(
      (ebook) => ebook.title !== ebookTitleToDelete
    );
    localStorage.setItem("ebooks", JSON.stringify(updatedEbooks));
    setEbooks(updatedEbooks);

    // If the deleted ebook was the current one, load the first available ebook or create a new one
    if (ebookTitleToDelete === ebookTitle) {
      if (updatedEbooks.length > 0) {
        loadFromLocalStorage(updatedEbooks[0].title);
      } else {
        createNewEbook();
      }
    }
  };

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  useEffect(() => {
    if (!isSaved) {
      saveToLocalStorage();
    }
  }, [isSaved]);

  // useEffect(() => {
  //   const saveTimer = setTimeout(() => {
  //     if (!isSaved) {
  //       saveToLocalStorage();
  //     }
  //   }, 2000); // Auto-save after 2 seconds of inactivity

  //   return () => clearTimeout(saveTimer);
  // }, [isSaved, saveToLocalStorage]);

  return {
    ebookTitle,
    setEbookTitle,
    chapters,
    setChapters,
    currentChapter,
    setCurrentChapter,
    systemPrompts,
    setSystemPrompts,
    parameters,
    setParameters,
    ebooks,
    isSaved,
    setIsSaved,
    lastSavedTime,
    loadFromLocalStorage,
    createNewEbook,
    deleteEbook,
  };
};
