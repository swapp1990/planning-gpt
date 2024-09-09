import React, { useEffect, useState } from "react";
import { useEbook } from "../../context/EbookContext";
import { FaEdit, FaCheck, FaTimes, FaPlus } from "react-icons/fa";

import Paragraph from "./Paragraph";
import AddParagraph from "./AddParagraph";

const Synopsis = ({ synopsis, chapterId }) => {
  return (
    <div className="mb-6">
      <div className="bg-gray-100 p-4 rounded-md h-24 overflow-y-auto relative">
        <p className="text-gray-600 pr-2">{synopsis}</p>
      </div>
    </div>
  );
};

const ChapterView = ({ chapter }) => {
  const { chapterActions } = useEbook();
  const [paragraphs, setParagraphs] = useState([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isAddingParagraph, setIsAddingParagraph] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chapter.title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // console.log(chapter);
    setEditedTitle(chapter.title);
  }, [chapter.title]);
  //   useEffect(() => {
  //     if (chapter.content) {
  //       console.log(chapter.content);
  //       setParagraphs(
  //         chapter.content
  //           .split("\n\n")
  //           .filter((p) => p.trim() !== "")
  //           .map((p) => p.trim())
  //       );
  //     }
  //   }, [chapter.content]);

  const handleTitleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await chapterActions.updateChapterTitle(chapter.id, editedTitle);
      setIsEditingTitle(false);
    } catch (err) {
      setError("Failed to update chapter title. Please try again.");
    }
    setIsLoading(false);
  };

  const handleParagraphEdit = async (index, newContent) => {
    setIsLoading(true);
    setError(null);
    try {
      await chapterActions.updateParagraph(chapter.id, index, newContent);
    } catch (err) {
      setError("Failed to update paragraph. Please try again.");
    }
    setIsLoading(false);
  };

  const handleParagraphDelete = async (index) => {
    setIsLoading(true);
    setError(null);
    try {
      await chapterActions.deleteParagraph(chapter.id, index);
    } catch (err) {
      console.log(err);
      setError("Failed to delete paragraph. Please try again.");
    }
    setIsLoading(false);
  };

  const handleAddParagraph = async () => {
    setIsLoading(true);
    setError(null);
    try {
      //   await chapterActions.addParagraph(chapter.id, "");
    } catch (err) {
      setError("Failed to add new paragraph. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {isEditingTitle ? (
        <div className="mb-4">
          <input
            type="text"
            className="w-full p-2 text-2xl font-bold border rounded"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={handleTitleSave}
              className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={isLoading}
            >
              <FaCheck />
            </button>
            <button
              onClick={() => setIsEditingTitle(false)}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={isLoading}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{chapter.title}</h2>
          <button
            onClick={() => setIsEditingTitle(true)}
            className="p-2 text-blue-500 hover:text-blue-600"
          >
            <FaEdit />
          </button>
        </div>
      )}
      <Synopsis synopsis={chapter.synopsis} chapterId={chapter.id} />
      {chapter.content.map((paragraph, index) => (
        <Paragraph
          key={index}
          content={paragraph}
          index={index}
          onEdit={handleParagraphEdit}
          onDelete={handleParagraphDelete}
        />
      ))}

      {isAddingParagraph ? (
        <AddParagraph
          chapterId={chapter.id}
          onClose={() => setIsAddingParagraph(false)}
        />
      ) : (
        <button
          onClick={() => setIsAddingParagraph(true)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
        >
          Continue
        </button>
      )}

      {isLoading && <p className="mt-4 text-gray-600">Loading...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default ChapterView;
