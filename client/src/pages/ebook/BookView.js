import React from "react";
import BookHeader from "../../components/ebook/BookHeader";
import ParametersPanel from "../../components/ebook/ParametersPanel";

const BookView = () => {
  return (
    <div className="h-full flex flex-col bg-gray-100">
      <BookHeader />
      <div className="flex-grow overflow-hidden relative">
        <main className="h-full overflow-auto p-4">
          <div className="max-w-3xl mx-auto">
            <ParametersPanel />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BookView;
