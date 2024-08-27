import React, { useState, useEffect } from "react";
import Paragraph from "./Paragraph";
import { FaPlus, FaCheck } from "react-icons/fa";

const Chapter = React.forwardRef(
  (
    {
      chapter,
      onParagraphSelect,
      selectedParagraph,
      onRewrite,
      onContParagraph,
      onCloseMenu,
      onAddParagraph,
    },
    ref
  ) => {
    const [isContinueOpen, setIsContinueOpen] = useState(false);
    const [newParagraphContent, setNewParagraphContent] = useState("");
    const [paragraphs, setParagraphs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
      //   console.log(chapter.content.split("\n\n"));
      setParagraphs(
        chapter.content
          .split("\n\n")
          .filter((p) => p.trim() !== "")
          .map((p) => p.trim())
      );
    }, [chapter.content]);

    const handleContinueClick = () => {
      setIsContinueOpen(true);
    };

    const handleCancelContinue = () => {
      setIsContinueOpen(false);
      setNewParagraphContent("");
    };

    const handleSubmitContinue = async () => {
      setIsLoading(true);
      let response = await onAddParagraph(chapter.id, newParagraphContent);
      if (response.newParagraph) {
        setIsContinueOpen(false);
        setNewParagraphContent("");
        setIsLoading(false);
      }
    };

    return (
      <div ref={ref} className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          {chapter.title}
        </h2>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Summary</h3>
          <div className="bg-gray-100 p-4 rounded-md h-24 overflow-y-auto relative">
            <p className="text-gray-600 pr-2">{chapter.summary}</p>
          </div>
        </div>
        <div className="prose max-w-none">
          {paragraphs.map((paragraph, index) => (
            <Paragraph
              key={index}
              content={paragraph}
              onSelect={onParagraphSelect}
              isSelected={selectedParagraph === index}
              onRewrite={onRewrite}
              onContParagraph={onContParagraph}
              onCloseMenu={onCloseMenu}
              chapterId={chapter.id}
              paragraphIndex={index}
            />
          ))}
        </div>
        {!isContinueOpen ? (
          <button
            onClick={handleContinueClick}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
          >
            <FaPlus size={16} className="mr-2" />
            Continue Chapter
          </button>
        ) : (
          <div className="mt-4">
            <textarea
              className="w-full p-2 border rounded-md"
              rows="4"
              placeholder="Enter new paragraph content..."
              value={newParagraphContent}
              onChange={(e) => setNewParagraphContent(e.target.value)}
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={handleCancelContinue}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitContinue}
                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-spin mr-2">&#9696;</span>
                ) : (
                  <FaCheck size={16} className="mr-1" />
                )}
                {isLoading ? "Writing..." : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default Chapter;
