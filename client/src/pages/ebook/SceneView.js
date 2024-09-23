// SceneView.js
import React, { useState, useCallback } from "react";
import { FaChevronRight, FaEdit, FaTrash, FaChevronDown } from "react-icons/fa";
import { MdLocationOn, MdAccessTime, MdDescription } from "react-icons/md";
import { RiChatQuoteLine, RiWalkLine, RiArrowRightLine } from "react-icons/ri";
import { useSceneState } from "../../hooks/useSceneState";
import { useElementInteractions } from "../../hooks/useElementInteractions";
import { useNewElements } from "../../hooks/useNewElements";
import SceneElement from "./SceneElement";
import SceneSettings from "./SceneSettings";
import DraftSceneControls from "./DraftSceneControls";
import ElementContentGenerator from "./ElementContentGenerator";
import ContentGenerator from "./ContentGenerator";
import NewElementsControls from "./NewElementsControls";

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
  } = useSceneState(scenes, onUpdateScene, onDeleteScene);

  const {
    selectedElementIndex,
    deletingIndex,
    hoverIndex,
    handleElementSelect,
    handleElementDelete,
    handleElementEdit,
  } = useElementInteractions();

  const {
    newElements,
    elementWithGenerator,
    handleElementInsert,
    handleAcceptNewElements,
    handleRejectNewElements,
    setElementWithGenerator,
  } = useNewElements(draftScene, handleFinalizeDraft);

  const renderElements = (elements, isNewElement = false) => {
    return elements.map((element, elemIndex) => (
      <SceneElement
        key={isNewElement ? `new-${elemIndex}` : elemIndex}
        element={element}
        elemIndex={elemIndex}
        isSelected={selectedElementIndex === elemIndex}
        onSelect={(index) => handleElementSelect(index)}
      />
    ));
  };

  const sceneView = (scene) => {
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

        {expandedSceneIndex === index && sceneView(scene)}
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
          />
        </div>

        {sceneView(draftScene)}
      </div>
    );
  };

  return (
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
          generationType="new_scene"
          title="Generate New Scene"
        />
      )}
    </div>
  );
};

export default SceneView;
