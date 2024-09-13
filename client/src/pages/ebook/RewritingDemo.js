// src/RewritingDemo.jsx

import React, { useState, useEffect } from "react";
import { FaPencilAlt, FaTrash, FaPlus, FaCopy } from "react-icons/fa";
import "tailwindcss/tailwind.css";

// Understandable sample text with three paragraphs
const sampleText = `Artificial Intelligence (AI) has revolutionized various industries by automating complex tasks and providing insightful data analysis. Its applications range from healthcare and finance to entertainment and transportation, making processes more efficient and accurate.

In the healthcare sector, AI assists in diagnosing diseases, personalizing treatment plans, and predicting patient outcomes. Machine learning algorithms analyze vast amounts of medical data, enabling early detection of conditions such as cancer and heart disease, thereby saving countless lives.

The financial industry leverages AI for fraud detection, risk management, and customer service automation. By analyzing transaction patterns and market trends, AI systems can identify suspicious activities and optimize investment strategies, ensuring financial stability and growth.`;

// Revised text with random changes (edits, removals, additions)
const revisedText = `Artificial Intelligence (AI) has significantly transformed various industries by automating complex tasks and offering insightful data analysis. Its applications extend from healthcare and finance to entertainment and transportation, enhancing processes to be more efficient and precise.

In the healthcare sector, AI plays a crucial role in diagnosing diseases, customizing treatment plans, and forecasting patient outcomes. Advanced machine learning algorithms scrutinize vast amounts of medical data, enabling early detection of conditions such as cancer and cardiovascular diseases, thereby saving numerous lives.

The financial industry utilizes AI for fraud detection, risk assessment, and customer service automation. By analyzing transaction patterns and market dynamics, AI systems can identify suspicious activities and refine investment strategies, ensuring financial stability and sustained growth.`;

// Icons for visualization
const EditIcon = (
  <FaPencilAlt className="inline text-yellow-500 mr-1" title="Edit" />
);
const RemoveIcon = (
  <FaTrash className="inline text-red-500 mr-1" title="Remove" />
);
const AddIcon = <FaPlus className="inline text-green-500 mr-1" title="Add" />;

// Word Count Component
const WordCount = ({ text }) => {
  const count = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  return <div className="text-sm text-gray-600">Word Count: {count}</div>;
};

// Input Section Component
const InputSection = ({ inputText, setInputText, onRevise, isScanning }) => {
  const handleChange = (e) => {
    setInputText(e.target.value);
  };

  return (
    <div className="w-full p-4 bg-white rounded shadow-md">
      <label htmlFor="inputText" className="block text-lg font-medium mb-2">
        Enter Your Text
      </label>
      <textarea
        id="inputText"
        aria-label="Input Text Area"
        className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows="10"
        value={inputText}
        onChange={handleChange}
        disabled={isScanning}
      ></textarea>
      <div className="flex justify-between items-center mt-2">
        <WordCount text={inputText} />
        <button
          onClick={onRevise}
          className={`flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isScanning ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isScanning}
          aria-label="Revise Button"
        >
          {isScanning ? "Scanning..." : "Revise"}
        </button>
      </div>
    </div>
  );
};

// Enhanced Visualization Component to Maintain Paragraph Structure and Show Icons
const EnhancedVisualization = ({
  paragraphs,
  currentParagraph,
  currentSentence,
}) => {
  return (
    <div className="w-full p-4 bg-gray-100 rounded shadow-md mt-4">
      <h2 className="text-lg font-medium mb-2">AI Scanning Visualization</h2>
      <div className="space-y-4">
        {paragraphs.map((para, pIdx) => (
          <p key={pIdx} className="mb-2">
            {para.sentences.map((sentence, sIdx) => {
              const isCurrent =
                pIdx === currentParagraph && sIdx === currentSentence;
              let icon = null;
              if (sentence.type === "edit") {
                icon = EditIcon;
              } else if (sentence.type === "remove") {
                icon = RemoveIcon;
              } else if (sentence.type === "add") {
                icon = AddIcon;
              }

              let bgColor = "";
              if (sentence.type === "edit") {
                bgColor = "bg-yellow-100";
              } else if (sentence.type === "remove") {
                bgColor = "bg-red-100";
              } else if (sentence.type === "add") {
                bgColor = "bg-green-100";
              }

              if (isCurrent) {
                bgColor += " animate-pulse";
              }

              return (
                <span key={sIdx} className="mr-1">
                  {/* Display icon if there's a change */}
                  {icon && <span>{icon}</span>}
                  {/* Display sentence with appropriate background and line-through for removals */}
                  <span
                    className={`inline-block ${bgColor} ${
                      sentence.type === "remove" ? "line-through" : ""
                    }`}
                  >
                    {sentence.text}{" "}
                  </span>
                </span>
              );
            })}
          </p>
        ))}
      </div>
    </div>
  );
};

// Comparison Component
const Comparison = ({ original, revised, showChanges, changes }) => {
  // Split text into paragraphs
  const splitIntoParagraphs = (text) => {
    return text
      .split("\n")
      .filter((paragraph) => paragraph.trim() !== "")
      .map((paragraph) => paragraph.trim());
  };

  // Split paragraph into sentences
  const splitIntoSentences = (text) => {
    const regex = /[^\.!\?]+[\.!\?]+/g;
    const result = text.match(regex) || [];
    return result.map((sentence) => sentence.trim());
  };

  const originalParagraphs = splitIntoParagraphs(original).map((paragraph) => ({
    sentences: splitIntoSentences(paragraph),
  }));

  const revisedParagraphs = splitIntoParagraphs(revised).map((paragraph) => ({
    sentences: splitIntoSentences(paragraph),
  }));

  return (
    <div className="w-full p-4 bg-white rounded shadow-md mt-4">
      <h2 className="text-lg font-medium mb-2">Comparison</h2>
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        {/* Original Text */}
        <div className="md:w-1/2">
          <h3 className="font-semibold mb-1">Original Text</h3>
          <div className="p-2 border rounded bg-gray-50 h-64 overflow-auto">
            {originalParagraphs.map((para, pIdx) => (
              <p key={pIdx} className="mb-2">
                {para.sentences.map((sentence, sIdx) => {
                  // Check if this sentence was removed
                  const change = changes.find(
                    (c) =>
                      c.paragraph === pIdx &&
                      c.sentence === sIdx &&
                      c.type === "remove"
                  );
                  return (
                    <span
                      key={sIdx}
                      className={`mr-1 ${
                        change ? "bg-red-100 line-through" : ""
                      }`}
                      title={change ? "Removed" : ""}
                    >
                      {sentence}{" "}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>
        </div>
        {/* Revised Text */}
        <div className="md:w-1/2">
          <h3 className="font-semibold mb-1">Revised Text</h3>
          <div className="p-2 border rounded bg-gray-50 h-64 overflow-auto">
            {revisedParagraphs.map((para, pIdx) => (
              <p key={pIdx} className="mb-2">
                {para.sentences.map((sentence, sIdx) => {
                  // Check if this sentence was edited or added
                  const change = changes.find(
                    (c) => c.paragraph === pIdx && c.sentence === sIdx
                  );
                  let bgColor = "";
                  if (showChanges && change) {
                    if (change.type === "edit") {
                      bgColor = "bg-yellow-100";
                    } else if (change.type === "add") {
                      bgColor = "bg-green-100";
                    }
                  }
                  return (
                    <span
                      key={sIdx}
                      className={`mr-1 ${bgColor}`}
                      title={
                        showChanges && change
                          ? change.type === "edit"
                            ? "Edited"
                            : change.type === "add"
                            ? "Added"
                            : ""
                          : ""
                      }
                    >
                      {sentence}{" "}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-2 text-sm text-gray-600 flex space-x-4">
        <div className="flex items-center">
          <span className="w-4 h-4 bg-yellow-100 inline-block mr-1"></span>{" "}
          Edited
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 bg-green-100 inline-block mr-1"></span> Added
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 bg-red-100 inline-block mr-1 line-through"></span>{" "}
          Removed
        </div>
      </div>
    </div>
  );
};

// Main RewritingDemo Component
const RewritingDemo = () => {
  const [inputText, setInputText] = useState(sampleText);
  const [revised, setRevised] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState(-1);
  const [currentSentence, setCurrentSentence] = useState(-1);
  const [paragraphs, setParagraphs] = useState([]);
  const [showChanges, setShowChanges] = useState(true);
  const [error, setError] = useState("");

  // Helper function to split text into paragraphs
  const splitIntoParagraphs = (text) => {
    return text
      .split("\n")
      .filter((paragraph) => paragraph.trim() !== "")
      .map((paragraph) => paragraph.trim());
  };

  // Helper function to split paragraph into sentences
  const splitIntoSentences = (text) => {
    const regex = /[^\.!\?]+[\.!\?]+/g;
    const result = text.match(regex) || [];
    return result.map((sentence) => sentence.trim());
  };

  // Predefined changes for simulation (paragraph and sentence indices start at 0)
  const simulatedChanges = [
    { paragraph: 0, sentence: 2, type: "edit" }, // 3rd sentence of 1st paragraph
    { paragraph: 1, sentence: 1, type: "remove" }, // 2nd sentence of 2nd paragraph
    { paragraph: 2, sentence: 3, type: "add" }, // 4th sentence of 3rd paragraph
  ];

  // Handle Revise Button Click
  const handleRevise = () => {
    // Error handling for empty or too short input
    if (inputText.trim().length === 0) {
      setError("Input text cannot be empty.");
      return;
    }
    const paragraphCount = splitIntoParagraphs(inputText).length;
    if (paragraphCount < 3) {
      setError("Please enter at least 3 paragraphs.");
      return;
    }

    setError("");
    setIsScanning(true);
    setRevised("");
    setParagraphs([]);
    setCurrentParagraph(-1);
    setCurrentSentence(-1);

    // Split input into paragraphs and sentences
    const inputParagraphs = splitIntoParagraphs(inputText).map((paragraph) => ({
      sentences: splitIntoSentences(paragraph).map((sentence) => ({
        text: sentence,
        type: null,
      })),
    }));

    setParagraphs(inputParagraphs);
    let pIdx = 0;
    let sIdx = 0;

    const scanInterval = setInterval(() => {
      if (pIdx < inputParagraphs.length) {
        if (sIdx < inputParagraphs[pIdx].sentences.length) {
          // Check if current sentence has a simulated change
          const change = simulatedChanges.find(
            (c) => c.paragraph === pIdx && c.sentence === sIdx
          );
          setParagraphs((prevParagraphs) => {
            const newParagraphs = [...prevParagraphs];
            if (change) {
              newParagraphs[pIdx].sentences[sIdx].type = change.type;
            }
            return newParagraphs;
          });
          setCurrentParagraph(pIdx);
          setCurrentSentence(sIdx);
          sIdx++;
        } else {
          pIdx++;
          sIdx = 0;
        }
      } else {
        clearInterval(scanInterval);
        // After scanning, show revised text
        setTimeout(() => {
          setRevised(revisedText);
          setIsScanning(false);
        }, 500);
      }
    }, 1000);
  };

  // Handle Copy Revised Text
  const handleCopy = () => {
    navigator.clipboard.writeText(revised);
    alert("Revised text copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-center">
            AI-Powered Text Revision Tool
          </h1>
        </header>

        {/* Input Section */}
        <InputSection
          inputText={inputText}
          setInputText={setInputText}
          onRevise={handleRevise}
          isScanning={isScanning}
        />

        {/* Error Message */}
        {error && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Visualization */}
        {isScanning && (
          <EnhancedVisualization
            paragraphs={paragraphs}
            currentParagraph={currentParagraph}
            currentSentence={currentSentence}
          />
        )}

        {/* Revision Process */}
        {!isScanning && revised && (
          <>
            {/* Side-by-Side Comparison */}
            <Comparison
              original={inputText}
              revised={revised}
              showChanges={showChanges}
              changes={simulatedChanges}
            />

            {/* Additional Features */}
            <div className="flex justify-between items-center mt-4">
              <WordCount text={revised} />
              <div className="flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Copy Revised Text"
                >
                  <FaCopy className="mr-2" />
                  Copy Revised Text
                </button>
                <button
                  onClick={() => setShowChanges(!showChanges)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  aria-label="Toggle Show Changes"
                >
                  {showChanges ? "Show Clean Version" : "Show Changes"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} AI Text Revision Tool Demo
        </footer>
      </div>
    </div>
  );
};

export default RewritingDemo;
