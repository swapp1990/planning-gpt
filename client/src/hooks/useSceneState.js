import { useState, useCallback } from "react";

export const useSceneState = (initialScenes, onUpdateScene, onDeleteScene) => {
  const [draftScene, setDraftScene] = useState(null);
  const [expandedSceneIndex, setExpandedSceneIndex] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingSceneIndex, setEditingSceneIndex] = useState(null);
  const [newElementsMap, setNewElementsMap] = useState({});

  const toggleScene = useCallback((index) => {
    setExpandedSceneIndex((prevIndex) => (prevIndex === index ? null : index));
  }, []);

  const handleEditScene = useCallback(
    (index) => {
      setDraftScene(initialScenes[index]);
      setEditingSceneIndex(index);
      setExpandedSceneIndex(null);
    },
    [initialScenes, setDraftScene]
  );

  const handleContentProgress = useCallback((newContent) => {
    setDraftScene((prevDraftScene) => {
      const updatedDraftScene = prevDraftScene
        ? {
            ...prevDraftScene,
            elements: newContent.elements,
          }
        : newContent;

      return updatedDraftScene;
    });
  }, []);

  const handleNewElementsFinished = useCallback((newContent, elementIndex) => {
    console.log(newContent);
    setNewElementsMap((prevMap) => ({
      ...prevMap,
      [elementIndex]: newContent.elements,
    }));
  }, []);

  const handleAcceptNewElements = useCallback(
    (elementIndex) => {
      setDraftScene((prevDraftScene) => {
        const updatedElements = [...prevDraftScene.elements];
        updatedElements.splice(
          elementIndex + 1,
          0,
          ...newElementsMap[elementIndex]
        );
        return {
          ...prevDraftScene,
          elements: updatedElements,
        };
      });
      setNewElementsMap((prevMap) => {
        const newMap = { ...prevMap };
        delete newMap[elementIndex];
        return newMap;
      });
    },
    [newElementsMap]
  );

  const handleDeleteScene = useCallback(
    (index) => {
      if (window.confirm("Are you sure you want to delete this scene?")) {
        onDeleteScene(index);
      }
    },
    [onDeleteScene]
  );

  const handleFinalizeDraft = useCallback(() => {
    if (editingSceneIndex !== null) {
      const updatedScenes = [...initialScenes];
      updatedScenes[editingSceneIndex] = draftScene;
      onUpdateScene(updatedScenes);
    } else {
      onUpdateScene([...initialScenes, draftScene]);
    }
    setDraftScene(null);
    setEditingSceneIndex(null);
  }, [draftScene, editingSceneIndex, initialScenes, onUpdateScene]);

  const handleCancelDraft = useCallback(() => {
    setDraftScene(null);
    setEditingSceneIndex(null);
  }, []);

  const handleReloadDraft = useCallback(() => {
    // Implement draft reloading logic
    console.log("Reloading draft scene");
  }, []);

  return {
    draftScene,
    setDraftScene,
    isGenerating,
    setIsGenerating,
    editingSceneIndex,
    expandedSceneIndex,
    setEditingSceneIndex,
    handleContentProgress,
    handleNewElementsFinished,
    handleAcceptNewElements,
    handleFinalizeDraft,
    handleCancelDraft,
    handleReloadDraft,
    toggleScene,
    handleEditScene,
    handleDeleteScene,
    newElementsMap,
  };
};
