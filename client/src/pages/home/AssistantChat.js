import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";

import InputPopup from "../../components/InputPopup";

export default function AssistantChat({
  msgIndex,
  paragraphs,
  streaming,
  onParagraphUpdate,
}) {
  const [selectedParagraphIndex, setSelectedParagraphIndex] = useState(null);
  const [isParagraphUpdating, setIsParagraphUpdating] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [instruction, setInstruction] = useState("");

  const handleParagraphClick = async (index) => {
    setSelectedParagraphIndex(index);
    setPopupVisible(true);
    setPopupPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  };

  const handlePromptCancel = () => {
    setPopupVisible(false);
  };

  const handlePromptSubmit = async () => {
    setPopupVisible(false);
    setIsParagraphUpdating(true);
    let response = await onParagraphUpdate(
      msgIndex,
      selectedParagraphIndex,
      instruction
    );
    console.log(response);
    setIsParagraphUpdating(false);
  };

  return (
    <div className="mb-4 text-left bg-gray-300 w-[90%] lg:w-[50%] flex flex-col">
      {paragraphs.map(
        (paragraph, index) =>
          paragraph && (
            <div
              key={index}
              className={`inline-block p-4 pr-10 rounded-lg mb-4 cursor-pointer relative transition-all duration-300 ease-in-out transform hover:scale-105 text-white shadow-lg ${
                selectedParagraphIndex === index
                  ? "bg-gradient-to-r from-green-400 to-blue-400 border-l-4 border-green-500"
                  : "bg-gradient-to-r from-purple-500 to-pink-600"
              }`}
              onClick={() => handleParagraphClick(index)}
            >
              {isParagraphUpdating && selectedParagraphIndex == index && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-300 bg-opacity-50">
                  <FaSpinner className="animate-spin text-gray-600" size={32} />
                </div>
              )}
              {paragraph}
            </div>
          )
      )}

      {streaming && (
        <div className="flex justify-center mt-4">
          <FaSpinner className="animate-spin text-gray-600" size={24} />
        </div>
      )}

      <InputPopup
        position={popupPosition}
        visible={popupVisible}
        onClose={handlePromptCancel}
        onSubmit={handlePromptSubmit}
        promptValue={instruction}
        setPromptValue={setInstruction}
        placeholder="Enter your prompt to update selected paragraph"
        submitLabel="Submit"
        cancelLabel="Cancel"
      />
    </div>
  );
}
