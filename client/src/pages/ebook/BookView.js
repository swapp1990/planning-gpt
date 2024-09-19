import React, { useEffect, useState } from "react";
import { FaCog, FaListUl } from "react-icons/fa";

import TabSystem from "../../components/TabSystem";
import BookHeader from "./BookHeader";
import ParametersPanel from "./ParametersPanel";
import ChapterList from "./ChapterList";
import ChapterView from "./ChapterView";
import Sidebar from "./Sidebar";
import NewBookWizard from "./NewBookWizard";
import { useEbook } from "../../context/EbookContext";

const BookView = () => {
  const { ebookState, ebookActions } = useEbook();
  const [isEbookListOpen, setIsEbookListOpen] = useState(false);
  const [isNewBookWizardOpen, setIsNewBookWizardOpen] = useState(false);

  useEffect(() => {
    if (ebookState.ebookId == null) {
      setIsNewBookWizardOpen(true);
    } else {
      setIsNewBookWizardOpen(false);
    }
  }, [ebookState.ebookId]);

  const handleEbookSelect = (ebookId) => {
    setIsEbookListOpen(false);
    console.log("select ebook " + ebookId);
    ebookActions.loadEbook(ebookId);
  };

  const handleNewBookClick = () => {
    setIsEbookListOpen(false);
    setIsNewBookWizardOpen(true);
    ebookActions.resetState();
  };

  const handleWizardComplete = () => {
    setIsNewBookWizardOpen(false);
    // Additional logic to handle the new book creation
  };

  const tabs = [
    {
      title: "Chapters",
      icon: FaListUl,
      content: <ChapterList />,
    },
    {
      title: "Parameters",
      icon: FaCog,
      content: <ParametersPanel />,
    },
  ];

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
          onNewItem={handleNewBookClick}
          onDeleteItem={ebookActions.deleteEbook}
        />
        <main className="h-full overflow-auto p-4">
          <div className="max-w-5xl mx-auto">
            {isNewBookWizardOpen ? (
              <NewBookWizard onComplete={handleWizardComplete} />
            ) : (
              <>
                <TabSystem tabs={tabs} />
                {ebookState.currentChapter && (
                  <ChapterView
                    chapter={
                      ebookState.chapters.filter(
                        (chapter) => chapter.id === ebookState.currentChapter
                      )[0]
                    }
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BookView;
