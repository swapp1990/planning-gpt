import React from "react";
import Paragraph from "./Paragraph";

const Chapter = React.forwardRef(
  (
    {
      chapter,
      onParagraphSelect,
      selectedParagraph,
      isRewriteOpen,
      setIsRewriteOpen,
      onRewrite,
      onCloseMenu,
    },
    ref
  ) => {
    const paragraphs = chapter.content.split("\n\n").map((p) => p.trim());

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
              isRewriteOpen={isRewriteOpen}
              setIsRewriteOpen={setIsRewriteOpen}
              onRewrite={onRewrite}
              onCloseMenu={onCloseMenu}
              chapterId={chapter.id}
              paragraphIndex={index}
            />
          ))}
        </div>
      </div>
    );
  }
);

export default Chapter;
