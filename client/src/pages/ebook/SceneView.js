import React, { useCallback, useState, useEffect } from "react";
import {
  FaChevronDown,
  FaChevronRight,
  FaTrash,
  FaCheck,
  FaSyncAlt,
  FaTimes,
  FaEdit,
  FaCommentDots,
  FaArrowRight,
  FaSync,
} from "react-icons/fa";
import { MdLocationOn, MdAccessTime, MdDescription } from "react-icons/md";
import { RiChatQuoteLine, RiWalkLine, RiArrowRightLine } from "react-icons/ri";
import ContentGenerator from "./ContentGenerator";

const SceneView = ({
  scenes,
  chapterId,
  sectionIndex,
  outline,
  onUpdateScene,
  onDeleteScene,
}) => {
  const [draftScene, setDraftScene] = useState(null);
  const [expandedScene, setExpandedScene] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingSceneIndex, setEditingSceneIndex] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showContinueGenerator, setShowContinueGenerator] = useState(false);
  const [showRewriteGenerator, setShowRewriteGenerator] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const toggleScene = (index) => {
    setExpandedScene(expandedScene === index ? null : index);
  };

  const handleDeleteScene = useCallback((index) => {
    onDeleteScene(index);
  }, []);

  const handleEditScene = useCallback(
    (index) => {
      setDraftScene(scenes[index]);
      setEditingSceneIndex(index);
      setExpandedScene(null);
    },
    [scenes]
  );

  const handleFinalizeDraft = () => {
    if (editingSceneIndex !== null) {
      // Update existing scene
      const updatedScenes = [...scenes];
      console.log(editingSceneIndex);
      updatedScenes[editingSceneIndex] = draftScene;
      console.log(updatedScenes);
      onUpdateScene(updatedScenes);
    } else {
      // Add new scene
      onUpdateScene([...scenes, draftScene]);
    }
    setDraftScene(null);
    setEditingSceneIndex(null);
    setSelectedElement(null);
  };

  const handleCancelDraft = () => {
    setDraftScene(null);
    setEditingSceneIndex(null);
  };

  const handleReloadDraft = () => {
    // You can implement logic to regenerate the draft scene here
    console.log("Reloading draft scene");
  };

  useEffect(() => {
    // console.log("Draft Scene Updated:", draftScene);
  }, [draftScene]);

  const handleGenerateStarted = () => {
    setDraftScene(null);
    setIsGenerating(true);
    setShowContinueGenerator(false);
    setShowRewriteGenerator(false);
  };

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
    setExpandedScene(scenes ? scenes.length : 0);
  }, []);

  const handleSceneContinueProgress = useCallback(
    (newContent) => {
      if (newContent) {
        setDraftScene((prevDraftScene) => {
          if (!prevDraftScene) {
            console.log("No previous draft scene, creating new one");
            return newContent;
          }

          const updatedDraftScene = {
            ...prevDraftScene,
            elements: [
              ...prevDraftScene.elements,
              ...(newContent.elements.length > 0
                ? [newContent.elements[newContent.elements.length - 1]]
                : []),
            ],
          };

          //   console.log("Updated draft scene:", updatedDraftScene);
          return updatedDraftScene;
        });
      }

      setExpandedScene(scenes ? scenes.length : 0);
    },
    [scenes]
  );

  const handleSceneRewriteProgress = useCallback((newContent) => {
    setDraftScene((prevDraftScene) => {
      const updatedDraftScene = prevDraftScene
        ? {
            ...prevDraftScene,
            elements: newContent.elements,
          }
        : newContent;

      return updatedDraftScene;
    });
    setExpandedScene(null);
  }, []);

  const handleSceneContinueStarted = () => {};
  const handleSceneContinueFinished = () => {};

  const handleContentFinished = () => {
    setIsGenerating(false);
    setShowContinueGenerator(false);
    setShowRewriteGenerator(false);
  };

  const sceneView = (scene) => {
    const handleElementSelect = (index) => {
      setSelectedElement(index);
    };

    const handleElementDelete = (index) => {
      if (deletingIndex === index) {
        const updatedElements = scene.elements.slice(0, index);
        setDraftScene({
          ...scene,
          elements: updatedElements,
        });
        setSelectedElement(null);
        setDeletingIndex(null);
        setHoverIndex(null);
      } else {
        setDeletingIndex(index);
      }
    };

    const handleCancelDelete = () => {
      setDeletingIndex(null);
      setHoverIndex(null);
    };

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
        <div className="space-y-4">
          {scene.elements.map((element, elemIndex) => (
            <div
              key={elemIndex}
              className={`pl-4 border-l-4 ${
                (deletingIndex !== null && elemIndex >= deletingIndex) ||
                (hoverIndex !== null && elemIndex >= hoverIndex)
                  ? "border-red-200"
                  : "border-gray-200"
              } relative group cursor-pointer`}
              onClick={() => handleElementSelect(elemIndex)}
            >
              <button className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaChevronRight className="text-gray-600" />
              </button>
              {selectedElement === elemIndex && (
                <>
                  <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 p-1">
                    <FaChevronRight className="text-white-600" />
                  </div>
                  <div className="absolute right-0 top-0 space-x-2">
                    <button
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => console.log("Edit element")}
                    >
                      <FaEdit />
                    </button>
                    {deletingIndex === elemIndex ? (
                      <>
                        <button
                          className="text-green-500 hover:text-green-700"
                          onClick={() => handleElementDelete(elemIndex)}
                        >
                          <FaCheck />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={handleCancelDelete}
                        >
                          <FaTimes />
                        </button>
                      </>
                    ) : (
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleElementDelete(elemIndex)}
                        onMouseEnter={() => setHoverIndex(elemIndex)}
                        onMouseLeave={() => setHoverIndex(null)}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </>
              )}
              {element.type === "action" && (
                <div className="flex items-start">
                  <RiWalkLine className="mt-1 mr-2 text-blue-500" />
                  <p className="text-gray-800">{element.description}</p>
                </div>
              )}
              {element.type === "dialogue" && (
                <div>
                  <div className="flex items-center mb-1">
                    <RiChatQuoteLine className="mr-2 text-green-500" />
                    <p className="font-bold text-gray-900">
                      {element.character}
                    </p>
                  </div>
                  {element.parenthetical && (
                    <p className="italic text-gray-600 ml-6 mb-1">
                      ({element.parenthetical})
                    </p>
                  )}
                  <p className="text-gray-800 ml-6">{element.line}</p>
                </div>
              )}
              {element.type === "internal_monologue" && (
                <div className="flex items-start">
                  <FaCommentDots className="mt-1 mr-2 text-purple-500" />
                  <p className="italic text-gray-700">{element.description}</p>
                </div>
              )}
              {element.type === "transition" && (
                <div className="flex items-center justify-end">
                  <p className="font-bold text-gray-600 mr-2">
                    {element.description}
                  </p>
                  <RiArrowRightLine className="text-gray-500" />
                </div>
              )}
            </div>
          ))}
        </div>
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
            {expandedScene === index ? (
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

        {expandedScene === index && sceneView(scene)}
      </div>
    );
  };

  const renderDraftScene = () => {
    if (!draftScene) return null;

    const titleText =
      editingSceneIndex !== null
        ? `Editing Scene ${draftScene.title || ` ${editingSceneIndex + 1}`}`
        : `Creating New Scene:  ${draftScene.title || "Unknown Title"}`;

    return (
      <div
        className={`border rounded-lg shadow-sm bg-yellow-50 border-yellow-200`}
      >
        <h3 className="text-xl font-semibold text-yellow-800 p-4 border-b border-yellow-200">
          {titleText}
        </h3>
        {!isGenerating && (
          <div className="mb-6">
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleFinalizeDraft}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
              >
                <FaCheck className="mr-2" />
                {editingSceneIndex !== null ? "Update" : "Finalize"}
              </button>
              <button
                onClick={handleReloadDraft}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
              >
                <FaSyncAlt className="mr-2" />
                Reload
              </button>
              <button
                onClick={handleCancelDraft}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 flex items-center"
              >
                <FaTimes className="mr-2" />
                {editingSceneIndex !== null ? "Cancel" : "Clear"}
              </button>
            </div>
          </div>
        )}
        {sceneView(draftScene)}
        {!isGenerating && (
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowContinueGenerator(true);
                setShowRewriteGenerator(false);
              }}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors duration-200 flex items-center"
            >
              <FaArrowRight className="mr-2" />
              Continue
            </button>
            <button
              onClick={() => {
                setShowContinueGenerator(false);
                setShowRewriteGenerator(true);
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors duration-200 flex items-center"
            >
              <FaSync className="mr-2" />
              Rewrite
            </button>
          </div>
        )}
        <div className="mt-6">
          {showContinueGenerator && (
            <ContentGenerator
              paraInfo={{
                chapterId: chapterId,
                sectionIndex: sectionIndex,
                outline: outline,
                scene: draftScene,
              }}
              onStarted={handleSceneContinueStarted}
              onProgress={handleSceneContinueProgress}
              onFinished={handleSceneContinueFinished}
              renderContent={() => {}}
              generationType="continue_scene"
              title="Continue Scene"
            />
          )}
          {showRewriteGenerator && (
            <ContentGenerator
              paraInfo={{
                chapterId: chapterId,
                sectionIndex: sectionIndex,
                outline: outline,
                scene: draftScene,
              }}
              onStarted={handleGenerateStarted}
              onProgress={handleSceneRewriteProgress}
              onFinished={handleContentFinished}
              renderContent={() => {}}
              generationType="rewrite_scene"
              title="Rewrite Scene"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {scenes.map((scene, index) => renderScene(scene, index))}

      {renderDraftScene()}

      <ContentGenerator
        paraInfo={{
          chapterId: chapterId,
          sectionIndex: sectionIndex,
          outline: outline,
        }}
        onStarted={handleGenerateStarted}
        onProgress={handleContentProgress}
        onFinished={handleContentFinished}
        generationType="new_scene"
        title="Generate New Scene"
      />
    </div>
  );
};

export default SceneView;
