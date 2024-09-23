import { useState, useCallback } from "react";

export const useElementInteractions = () => {
  const [selectedElementIndex, setSelectedElementIndex] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const handleElementSelect = useCallback(
    (index) => {
      setSelectedElementIndex(selectedElementIndex === index ? null : index);
    },
    [selectedElementIndex]
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
    deletingIndex,
    hoverIndex,
    handleElementSelect,
    handleElementDelete,
    handleElementEdit,
    setHoverIndex,
  };
};
