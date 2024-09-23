import { useState, useCallback } from "react";

export const useElementInteractions = () => {
  const [selectedElementIndex, setSelectedElementIndex] = useState(null);
  const [addElementIndex, setAddElementIndex] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const handleElementSelect = useCallback(
    (index) => {
      setSelectedElementIndex(selectedElementIndex === index ? null : index);
      setAddElementIndex(null);
    },
    [selectedElementIndex]
  );

  const handleElementAddContent = useCallback(
    (index) => {
      setAddElementIndex(index);
    },
    [addElementIndex]
  );

  const handleElementDelete = useCallback(
    (index) => {
      if (deletingIndex === index) {
        // Perform actual deletion
        setDeletingIndex(null);
      } else {
        setDeletingIndex(index);
      }
    },
    [deletingIndex]
  );

  const handleElementEdit = useCallback((index) => {
    // Implement edit logic
    console.log("Editing element", index);
  }, []);

  return {
    selectedElementIndex,
    addElementIndex,
    deletingIndex,
    hoverIndex,
    handleElementSelect,
    handleElementAddContent,
    handleElementDelete,
    handleElementEdit,
    setHoverIndex,
  };
};
