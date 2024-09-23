import { useState, useCallback } from "react";

export const useNewElements = (draftScene, onFinalizeDraft) => {
  const [newElements, setNewElements] = useState([]);
  const [elementWithGenerator, setElementWithGenerator] = useState(null);

  const handleElementInsert = useCallback((insertIndex, elements) => {
    setNewElements((prev) => [
      ...prev,
      ...elements.map((el) => ({ ...el, insertIndex })),
    ]);
  }, []);

  const handleAcceptNewElements = useCallback(() => {
    const updatedElements = [...draftScene.elements];
    newElements.forEach((el) => {
      updatedElements.splice(el.insertIndex + 1, 0, el);
    });
    onFinalizeDraft({ ...draftScene, elements: updatedElements });
    setNewElements([]);
  }, [draftScene, newElements, onFinalizeDraft]);

  const handleRejectNewElements = useCallback(() => {
    setNewElements([]);
  }, []);

  return {
    newElements,
    elementWithGenerator,
    handleElementInsert,
    handleAcceptNewElements,
    handleRejectNewElements,
    setElementWithGenerator,
  };
};
