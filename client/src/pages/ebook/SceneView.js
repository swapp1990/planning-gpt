import React, { useCallback, useState, useEffect } from "react";
import {
  FaChevronDown,
  FaChevronRight,
  FaTrash,
  FaCheck,
  FaSyncAlt,
  FaTimes,
  FaThoughtBubble,
} from "react-icons/fa";
import { MdLocationOn, MdAccessTime, MdDescription } from "react-icons/md";
import { RiChatQuoteLine, RiWalkLine, RiArrowRightLine } from "react-icons/ri";
import ContentGenerator from "./ContentGenerator";

const SceneView = ({
  scenes,
  chapterId,
  sectionIndex,
  outline,
  onAddScene,
  onDeleteScene,
}) => {
  const [draftScene, setDraftScene] = useState(null);
  const [expandedScene, setExpandedScene] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleScene = (index) => {
    setExpandedScene(expandedScene === index ? null : index);
  };

  const handleDeleteScene = useCallback((index) => {
    onDeleteScene(index);
  }, []);

  const handleFinalizeDraft = () => {
    onAddScene(draftScene);
    setDraftScene(null);
  };

  const handleCancelDraft = () => {
    setDraftScene(null);
  };

  const handleReloadDraft = () => {
    // You can implement logic to regenerate the draft scene here
    console.log("Reloading draft scene");
  };

  useEffect(() => {
    // console.log("Draft Scene Updated:", draftScene);
  }, [draftScene]);

  const handleGenerateStarted = () => {
    setIsGenerating(true);
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

  const handleContentFinished = () => {
    setIsGenerating(false);
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
        <div className="space-y-4">
          {scene.elements.map((element, elemIndex) => (
            <div key={elemIndex} className="pl-4 border-l-4 border-gray-200">
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
                  <RiChatQuoteLine className="mt-1 mr-2 text-purple-500" />
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
    return (
      <div
        key={index}
        className={`border rounded-lg shadow-sm bg-white border-gray-200}`}
      >
        <div
          className="p-4 cursor-pointer flex justify-between items-center"
          onClick={() => toggleScene(index)}
        >
          <div className="flex items-center">
            {expandedScene === index ? (
              <FaChevronDown size={20} className="text-gray-500" />
            ) : (
              <FaChevronRight size={20} className="text-gray-500" />
            )}
            <span className={`ml-2 font-semibold text-lg text-gray-800}`}>
              {scene.title || `Scene ${index + 1}`}
            </span>
          </div>
          <FaTrash
            size={20}
            className="text-red-500 hover:text-red-700 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteScene(index);
            }}
          />
        </div>

        {expandedScene === index && sceneView(scene)}
      </div>
    );
  };

  const renderDraftScene = () => {
    if (!draftScene) return null;
    return (
      <div
        className={`border rounded-lg shadow-sm bg-yellow-50 border-yellow-200`}
      >
        {!isGenerating && (
          <div className="mb-6">
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleFinalizeDraft}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
              >
                <FaCheck className="mr-2" />
                Finalize
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
                Clear
              </button>
            </div>
          </div>
        )}
        {sceneView(draftScene)}
        <div className="mt-6">
          {!isGenerating && (
            <ContentGenerator
              paraInfo={{
                chapterId: chapterId,
                sectionIndex: sectionIndex,
                outline: outline,
                scene: draftScene,
              }}
              onFinalize={(newScene) => setDraftScene(newScene[0])}
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
