import React, { useState, useCallback, useEffect } from "react";
import { FaEdit, FaCheck, FaTimes, FaTrash, FaOutdent } from "react-icons/fa";
import { useEbook } from "../../context/EbookContext";
import Synopsis from "./Synopsis";
import Section from "./Section";
import ContentGenerator from "./ContentGenerator";

const OutlineCard = ({ outline, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutline, setEditedOutline] = useState(outline);

  const handleSaveEdit = () => {
    onEdit(editedOutline);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedOutline(outline);
    setIsEditing(false);
  };

  return (
    <li className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 transition-colors duration-200 flex justify-between items-center">
      <div className="flex items-center flex-grow">
        <FaOutdent className="mr-3 text-yellow-600" />
        {isEditing ? (
          <textarea
            value={editedOutline}
            onChange={(e) => setEditedOutline(e.target.value)}
            className="w-full p-2 border rounded mr-2 text-sm"
            rows="2"
          />
        ) : (
          <span className="font-medium text-yellow-800">{outline}</span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              className="text-green-600 hover:text-green-800 transition-colors duration-200"
            >
              <FaCheck />
            </button>
            <button
              onClick={handleCancelEdit}
              className="text-red-600 hover:text-red-800 transition-colors duration-200"
            >
              <FaTimes />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <FaEdit />
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800 transition-colors duration-200"
            >
              <FaTrash />
            </button>
          </>
        )}
      </div>
    </li>
  );
};

const ChapterView = ({ chapter }) => {
  const { chapterActions, ebookState } = useEbook();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chapter.title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleSynopsisEdit = async (newSynopsis) => {
    setIsLoading(true);
    setError(null);
    try {
      await chapterActions.updateChapter(chapter.id, { synopsis: newSynopsis });
    } catch (err) {
      setError("Failed to update synopsis. Please try again.");
    }
    setIsLoading(false);
  };

  const handleNewOutlinesFinalize = (newOutlines) => {
    for (let o of newOutlines) {
      chapterActions.addSection(chapter.id, {
        outline: o.outline,
        paragraphs: [],
      });
    }
  };

  const renderDraftOutlines = (content, onEdit, onDelete) => {
    return content.map((o, index) => (
      <OutlineCard
        key={index}
        outline={o.outline}
        onEdit={(newOutline) => onEdit(index, newOutline)}
        onDelete={() => onDelete(index)}
      />
    ));
  };

  return (
    <div className="bg-white shadow rounded-lg p-2 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        {isEditingTitle ? (
          <div className="flex-grow">
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
          <div className="flex items-center flex-grow">
            <h2 className="text-2xl font-bold mr-2">{chapter.title}</h2>
            <button
              onClick={() => setIsEditingTitle(true)}
              className="p-1 text-blue-500 hover:text-blue-600"
              aria-label="Edit chapter title"
            >
              <FaEdit className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <Synopsis
        chapter={chapter}
        chapterId={chapter.id}
        onEdit={handleSynopsisEdit}
      />

      <h3 className="text-xl font-semibold my-4">Scenes</h3>
      {chapter.sections.map((section, index) => (
        <Section
          key={section.id || index}
          section={section}
          index={index}
          chapterId={chapter.id}
        />
      ))}

      <ContentGenerator
        onFinalize={handleNewOutlinesFinalize}
        renderContent={renderDraftOutlines}
        generationType="outlines"
        title="Generate new outlines"
      />
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default ChapterView;
