import React, { useState } from "react";
import BookHeader from "../../components/ebook/BookHeader";
import ParametersPanel from "./ParametersPanel";
import ChapterView from "./ChapterView";
import Sidebar from "./Sidebar";

import { useEbook } from "../../context/EbookContext";
import ChapterList from "./ChapterList";

const BookView = () => {
  const { ebookState, ebookActions } = useEbook();
  const [isEbookListOpen, setIsEbookListOpen] = useState(false);

  const handleEbookSelect = (ebookId) => {
    setIsEbookListOpen(false);
    console.log("select ebook " + ebookId);
    ebookActions.loadEbook(ebookId);
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <BookHeader setIsEbookListOpen={setIsEbookListOpen} />
      <div className="flex-grow overflow-hidden relative">
        <Sidebar
          items={ebookState.ebooks}
          currentItem={ebookState.ebookId}
          onItemClick={handleEbookSelect}
          isOpen={isEbookListOpen}
          onClose={() => setIsEbookListOpen(false)}
          title="Ebooks"
          onNewItem={ebookActions.createNewEbook}
          onDeleteItem={ebookActions.deleteEbook}
        />
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
