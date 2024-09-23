import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";

const ElementContentGenerator = ({ onInsert }) => {
  const [instruction, setInstruction] = useState("");
  const [count, setCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (instruction.trim() === "") return;

    setIsGenerating(true);

    // Mock API call to generate content
    // In a real implementation, you would call your AI service here
    const mockGenerateContent = () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const generatedElements = Array(count)
            .fill()
            .map((_, index) => ({
              type: "action", // You might want to randomize this or base it on the instruction
              description: `Generated ${instruction} action ${index + 1}`,
            }));
          resolve(generatedElements);
        }, 1000); // Simulate API delay
      });
    };

    try {
      const generatedElements = await mockGenerateContent();
      onInsert(generatedElements);
      setInstruction("");
      setCount(1);
    } catch (error) {
      console.error("Error generating content:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Enter instructions for generating content..."
        className="w-full p-2 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={3}
      />
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center">
          <label
            htmlFor="element-count"
            className="mr-2 text-sm font-medium text-gray-700"
          >
            Number of elements:
          </label>
          <input
            id="element-count"
            type="number"
            min="1"
            max="5"
            value={count}
            onChange={(e) =>
              setCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))
            }
            className="w-16 p-1 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || instruction.trim() === ""}
          className={`px-4 py-2 rounded-md text-white flex items-center ${
            isGenerating || instruction.trim() === ""
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          <FaPlus className="mr-2" />
          {isGenerating ? "Generating..." : "Generate"}
        </button>
      </div>
    </div>
  );
};

export default ElementContentGenerator;
