import React, { useState, useCallback } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import GenerationMenu from "./GenerationMenu";

const ContentGenerator = ({
  initialContent,
  onGenerate,
  onFinalize,
  onClose,
  renderContent,
  generationType = "paragraphs",
  title = "Generate new paragraphs",
}) => {
  const [instruction, setInstruction] = useState("");
  const [count, setCount] = useState(1);
  const [generatedContent, setGeneratedContent] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedContent([]);
    try {
      const newContent = await onGenerate(instruction, count);
      setGeneratedContent(newContent);
    } catch (error) {
      console.error(`Error generating ${generationType}:`, error);
    }
    setIsGenerating(false);
  }, [instruction, count, onGenerate, generationType]);

  const handleFinalize = useCallback(async () => {
    await onFinalize(generatedContent);
    setInstruction("");
    setGeneratedContent([]);
    setCount(1);
  }, [instruction, generatedContent]);

  return (
    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-md font-semibold text-yellow-700">{title}</h4>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-red-500 transition-colors duration-200"
          aria-label={`Close generated ${generationType}`}
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>

      <GenerationMenu
        instruction={instruction}
        setInstruction={setInstruction}
        count={count}
        setCount={setCount}
        onGenerate={handleGenerate}
        isLoading={isGenerating}
        generationType={generationType}
      />

      {generatedContent.length > 0 && (
        <>
          {renderContent(generatedContent)}
          <button
            onClick={handleFinalize}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
          >
            <FaPlus className="mr-2" />
            Finalize
          </button>
        </>
      )}
    </div>
  );
};

export default ContentGenerator;
