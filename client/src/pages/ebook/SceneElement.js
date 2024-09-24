import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  FaChevronRight,
  FaTrash,
  FaEdit,
  FaPlus,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
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

const SceneElement = ({
  element,
  elemIndex,
  newElements,
  isDeleting,
  isHovering,
  isNewElement,
  onEdit,
  onDelete,
  children,
}) => {
  const {
    selectedElementIndex,
    addElementIndex,
    handleElementSelect,
    handleElementAddContent,
    handleNewElementsFinished,
    handleAcceptNewElements,
  } = useSceneContext();

  const getBorderColor = () => {
    if (isDeleting || isHovering) return "border-red-200";
    if (isNewElement) return "border-green-500";
    if (selectedElementIndex == elemIndex) return "border-blue-500";
    return "border-gray-200";
  };

  const elementRef = useRef(null);

  const handleClick = (e) => {
    handleElementSelect(elemIndex);
  };

  const handleContentProgress = (content) => {
    console.log(content);
  };

  return (
    <div
      ref={elementRef}
      className={`pl-4 border-l-4 ${getBorderColor()} relative group cursor-pointer`}
      onClick={handleClick}
    >
      <button className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <FaChevronRight className="text-gray-600" />
      </button>

      {selectedElementIndex == elemIndex && (
        <div className="absolute right-0 top-0 space-x-2">
          <button
            className="text-green-500 hover:text-green-700"
            onClick={(e) => {
              e.stopPropagation();
              handleElementAddContent(elemIndex);
            }}
          >
            <FaPlus />
          </button>
          <button
            className="text-blue-500 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(elemIndex);
            }}
          >
            <FaEdit />
          </button>
          <button
            className="text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(elemIndex);
            }}
          >
            <FaTrash />
          </button>
        </div>
      )}

      {isNewElement && (
        <div className="absolute right-0 top-0 mr-8">
          <FaCheck className="text-green-500" />
        </div>
      )}

      {renderElementContent(element)}

      {children}

      {newElements && newElements.length > 0 && (
        <NewElementsBlock
          newElements={newElements}
          onAccept={() => handleAcceptNewElements(elemIndex)}
          onReject={() => onRejectNewElements(elemIndex)}
        />
      )}

      {addElementIndex === elemIndex && (
        <ContentGenerator
          paraInfo={{}}
          onClose={() => {}}
          onStarted={() => {
            /* Handle generation started */
          }}
          onProgress={handleContentProgress}
          onFinished={(newElements) =>
            handleNewElementsFinished(newElements, elemIndex)
          }
          generationType="inserted_scene"
          title="Generate Inserted Scene"
        />
      )}
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

export default SceneElement;
