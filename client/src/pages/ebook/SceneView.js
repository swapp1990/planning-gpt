// SceneView.js
import React, { useState, useCallback, useEffect } from "react";
import { FaChevronRight, FaEdit, FaTrash, FaChevronDown } from "react-icons/fa";
import { MdLocationOn, MdAccessTime, MdDescription } from "react-icons/md";
import { useSceneState } from "../../hooks/useSceneState";
import { useElementInteractions } from "../../hooks/useElementInteractions";
import SceneElement from "./SceneElement";
import DraftSceneControls from "./DraftSceneControls";
import ContentGenerator from "./ContentGenerator";
import { SceneProvider } from "../../context/SceneContext";

const SceneView = ({
  scenes,
  chapterId,
  sectionIndex,
  outline,
  onUpdateScene,
  onDeleteScene,
}) => {
  const {
    draftScene,
    expandedSceneIndex,
    setDraftScene,
    isGenerating,
    setIsGenerating,
    editingSceneIndex,
    handleFinalizeDraft,
    handleCancelDraft,
    handleReloadDraft,
    toggleScene,
    handleEditScene,
    handleDeleteScene,
    handleContentProgress,
    handleNewElementsFinished,
    handleAcceptNewElements,
    handleElementDelete,
    newElementsMap,
  } = useSceneState(scenes, onUpdateScene, onDeleteScene);

  const {
    selectedElementIndex,
    addElementIndex,
    deletingIndex,
    hoverIndex,
    handleElementSelect,
    handleElementAddContent,
    handleElementEdit,
  } = useElementInteractions();

  const contextValue = {
    chapterId,
    sectionIndex,
    outline,
    draftScene,
    setDraftScene,
    selectedElementIndex,
    addElementIndex,
    handleElementSelect,
    handleElementAddContent,
    handleNewElementsFinished,
    handleAcceptNewElements,
  };

  useEffect(() => {
    if (draftScene) {
      // console.log(draftScene.elements ? draftScene.elements.length : 0);
    }
  }, [draftScene]);

  const renderElements = (elements) => {
    return elements.map((element, elemIndex) => (
      <SceneElement
        key={elemIndex}
        element={element}
        elemIndex={elemIndex}
        isSelected={selectedElementIndex === elemIndex}
        isAddContent={addElementIndex === elemIndex}
        newElements={newElementsMap[elemIndex]}
        onSelect={(index) => handleElementSelect(index)}
        onAddContent={(index) => handleElementAddContent(index)}
        onDelete={(index) => handleElementDelete(index)}
      />
    ));
  };

  const sceneContent = (scene) => {
    return (
      <div className="p-4 border-t border-gray-200">
        {scene.setting && (
          <div className="mb-4 space-y-2">
            <p className="flex items-center text-gray-700">
              <MdLocationOn className="mr-2" />
              <span className="font-semibold">Location:</span>
              <span className="ml-2">{scene.setting.location}</span>
            </p>
            <p className="flex items-center text-gray-700">
              <MdAccessTime className="mr-2" />
              <span className="font-semibold">Time:</span>
              <span className="ml-2">{scene.setting.time}</span>
            </p>
            <p className="flex items-center text-gray-700">
              <MdDescription className="mr-2" />
              <span className="font-semibold">Description:</span>
              <span className="ml-2">{scene.setting.description}</span>
            </p>
          </div>
        )}
        <div className="space-y-4">{renderElements(scene.elements)}</div>
      </div>
    );
  };

  const renderScene = (scene, index) => {
    const isEditing = editingSceneIndex === index;
    return (
      <div
        key={index}
        className={`border rounded-lg shadow-sm bg-white border-gray-200}`}
      >
        <div
          className="p-4 cursor-pointer flex justify-between items-center"
          onClick={() => toggleScene(index)}
        >
          <div
            className={`flex items-center ${isEditing ? "bg-yellow-100" : ""}`}
          >
            {expandedSceneIndex === index ? (
              <FaChevronDown size={20} className="text-gray-500" />
            ) : (
              <FaChevronRight size={20} className="text-gray-500" />
            )}
            <span className={`ml-2 font-semibold text-lg text-gray-800}`}>
              {scene.title || `Scene ${index + 1}`}
            </span>
          </div>
          <div className="flex">
            <FaEdit
              size={20}
              className="text-blue-500 hover:text-blue-700 cursor-pointer mr-2"
              onClick={(e) => {
                e.stopPropagation();
                handleEditScene(index);
              }}
            />
            <FaTrash
              size={20}
              className="text-red-500 hover:text-red-700 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteScene(index);
              }}
            />
          </div>
        </div>

        {expandedSceneIndex === index && sceneContent(scene)}
      </div>
    );
  };

  const renderDraftScene = () => {
    if (!draftScene) return null;
    const titleText =
      editingSceneIndex !== null
        ? `Editing Scene: ${draftScene.title || ` ${editingSceneIndex + 1}`}`
        : `Creating New Scene:  ${draftScene.title || "Unknown Title"}`;
    return (
      <div
        className={`border rounded-lg shadow-sm bg-yellow-50 border-yellow-200`}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-yellow-800 p-4 border-b border-yellow-200">
            {titleText}
          </h3>
          <DraftSceneControls
            onCancel={handleCancelDraft}
            onReload={handleReloadDraft}
            onFinalize={handleFinalizeDraft}
            type="top"
          />
        </div>

        {sceneContent(draftScene)}
        <DraftSceneControls type="bottom" />
      </div>
    );
  };

  return (
    <SceneProvider value={contextValue}>
      <div className="space-y-4">
        {scenes.map((scene, index) => renderScene(scene, index))}
        {renderDraftScene()}
        {editingSceneIndex == null && (
          <ContentGenerator
            paraInfo={{
              chapterId: chapterId,
              sectionIndex: sectionIndex,
              outline: outline,
            }}
            onStarted={() => {
              /* Handle generation started */
            }}
            onProgress={handleContentProgress}
            onFinished={(scene) => {
              /* Handle finished */
            }}
            onClose={() => {}}
            generationType="new_scene"
            title="Generate New Scene"
          />
        )}
      </div>
    </SceneProvider>
  );
};

export default SceneView;
