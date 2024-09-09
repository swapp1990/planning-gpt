import React from "react";
import BookHeader from "../../components/ebook/BookHeader";
import ParametersPanel from "../../components/ebook/ParametersPanel";
import ChapterView from "./ChapterView";

import { useEbook } from "../../context/EbookContext";
import ChapterList from "./ChapterList";

const BookView = () => {
  const { ebookState } = useEbook();
  return (
    <div className="h-full flex flex-col bg-gray-100">
      <BookHeader />
      <div className="flex-grow overflow-hidden relative">
        <main className="h-full overflow-auto p-4">
          <div className="max-w-3xl mx-auto">
            <ParametersPanel />
            <ChapterList />
            {ebookState.currentChapter && (
              <ChapterView
                chapter={
                  ebookState.chapters.filter(
                    (chapter) => chapter.id === ebookState.currentChapter
                  )[0]
                }
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BookView;
