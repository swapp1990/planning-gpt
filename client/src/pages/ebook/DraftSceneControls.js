import React, { useState, useEffect } from "react";
import { FaCheck, FaSyncAlt, FaTimes, FaArrowRight } from "react-icons/fa";
import { RiWalkLine, RiChatQuoteLine, RiArrowRightLine } from "react-icons/ri";
import { FaCommentDots } from "react-icons/fa";
import ContentGenerator from "./ContentGenerator";
import { useSceneContext } from "../../context/SceneContext";

const NewElementsBlock = ({ newElements, onAccept, onReject }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
      <h4 className="text-green-700 font-semibold mb-2">New Elements</h4>
      {newElements.map((element, index) => (
        <div key={index} className="mb-2 pl-2 border-l-2 border-green-300">
          {renderElementContent(element)}
        </div>
      ))}
      <div className="flex justify-end space-x-2 mt-2">
        <button
          onClick={onAccept}
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
        >
          <FaCheck className="inline-block mr-1" /> Accept
        </button>
        <button
          onClick={onReject}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
        >
          <FaTimes className="inline-block mr-1" /> Reject
        </button>
      </div>
    </div>
  );
};

const renderElementContent = (element) => {
  switch (element.type) {
    case "action":
      return (
        <div className="flex items-start">
          <RiWalkLine className="mt-1 mr-2 text-blue-500" />
          <p className="text-gray-800">{element.description}</p>
        </div>
      );
    case "dialogue":
      return (
        <div>
          <div className="flex items-center mb-1">
            <RiChatQuoteLine className="mr-2 text-green-500" />
            <p className="font-bold text-gray-900">{element.character}</p>
          </div>
          {element.parenthetical && (
            <p className="italic text-gray-600 ml-6 mb-1">
              ({element.parenthetical})
            </p>
          )}
          <p className="text-gray-800 ml-6">{element.line}</p>
        </div>
      );
    case "internal_monologue":
      return (
        <div className="flex items-start">
          <FaCommentDots className="mt-1 mr-2 text-purple-500" />
          <p className="italic text-gray-700">{element.description}</p>
        </div>
      );
    case "transition":
      return (
        <div className="flex items-center justify-end">
          <p className="font-bold text-gray-600 mr-2">{element.description}</p>
          <RiArrowRightLine className="text-gray-500" />
        </div>
      );
    default:
      return null;
  }
};

const DraftSceneControls = ({
  isGenerating,
  onFinalize,
  onCancel,
  onReload,
  type = "top",
}) => {
  if (isGenerating) return null;
  const [showContinueGenerator, setShowContinueGenerator] = useState(false);
  const [newElements, setNewElements] = useState([]);

  const { chapterId, sectionIndex, outline, draftScene, setDraftScene } =
    useSceneContext();

  useEffect(() => {
    // console.log("newElements updated:", newElements);
  }, [newElements]);

  const handleContentStarted = () => {
    // console.log("handleContentStarted");
    setNewElements([]);
  };
  const handleContentProgress = (content) => {
    // console.log(content);
    if (content && content.elements) {
      // setNewElements(content.elements);
    }
  };
  const handleContentFinished = (content) => {
    // console.log(content);
    setNewElements(content.elements);
  };

  const handleNewElements = () => {
    setDraftScene((prevDraftScene) => {
      const updatedElements = [...prevDraftScene.elements, ...newElements];
      return {
        ...prevDraftScene,
        elements: updatedElements,
      };
    });
    setNewElements([]);
  };

  const renderNewElementsBlock = () => {
    if (newElements && newElements.length > 0) {
      return (
        <NewElementsBlock
          newElements={newElements}
          onAccept={handleNewElements}
          onReject={() => {
            console.log("Rejecting new elements");
            setNewElements([]);
          }}
        />
      );
    }
    return null;
  };

  return (
    <div>
      {type == "top" && (
        <div className="flex space-x-2">
          <button
            onClick={onFinalize}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
          >
            <FaCheck className="mr-2" />
            Finalize
          </button>
          <button
            onClick={onReload}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
          >
            <FaSyncAlt className="mr-2" />
            Reload
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 flex items-center"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
        </div>
      )}
      {type == "bottom" && (
        <>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowContinueGenerator(true);
              }}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors duration-200 flex items-center"
            >
              <FaArrowRight className="mr-2" />
              Continue
            </button>
            {/* <button
          onClick={() => {
            setShowContinueGenerator(false);
          }}
          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors duration-200 flex items-center"
        >
          <FaSync className="mr-2" />
          Rewrite
        </button> */}
          </div>
          {renderNewElementsBlock()}
          <div className="mt-6">
            {showContinueGenerator && (
              <ContentGenerator
                paraInfo={{
                  chapterId: chapterId,
                  sectionIndex: sectionIndex,
                  outline: outline,
                  scene: draftScene,
                }}
                onStarted={handleContentStarted}
                onProgress={handleContentProgress}
                onFinished={handleContentFinished}
                onClose={() => {}}
                generationType="continue_scene"
                title="Continue Scene"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DraftSceneControls;
