import React, { useState, useCallback } from "react";
import {
  FaEdit,
  FaCheck,
  FaTimes,
  FaPlus,
  FaSpinner,
  FaSyncAlt,
  FaTrash,
  FaOutdent,
} from "react-icons/fa";
import { useEbook } from "../../context/EbookContext";
import Synopsis from "./Synopsis";
import Section from "./Section";
import GenerationMenu from "./GenerationMenu";
import { getSuggestedOutlines } from "../../server/ebook";

const OutlineCard = ({ outline, index, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutline, setEditedOutline] = useState(outline);

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
              onClick={() => {
                onEdit(editedOutline);
                setIsEditing(false);
              }}
              className="text-green-600 hover:text-green-800 transition-colors duration-200"
            >
              <FaCheck />
            </button>
            <button
              onClick={() => setIsEditing(false)}
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

const GeneratedOutlinesSection = ({
  generatedOutlines,
  outlineInstruction,
  setOutlineInstruction,
  numOutlines,
  setNumOutlines,
  handleGenerateOutlines,
  handleReloadOutlines,
  handleAddOutlines,
  handleCloseOutlines,
  setGeneratedOutlines,
  isLoading,
}) => {
  if (generatedOutlines.length === 0) {
    return (
      <GenerationMenu
        instruction={outlineInstruction}
        setInstruction={setOutlineInstruction}
        count={numOutlines}
        setCount={setNumOutlines}
        onGenerate={handleGenerateOutlines}
        isLoading={isLoading}
        isRegeneration={false}
        generationType="outlines"
      />
    );
  }

  return (
    <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg shadow-md p-6 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-semibold text-gray-800">
          Generated Section Outlines
        </h4>
        <div className="flex space-x-2">
          <button
            onClick={handleAddOutlines}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
          >
            <FaPlus className="mr-2" />
            Add
          </button>
          <button
            onClick={handleCloseOutlines}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors duration-200"
            aria-label="Close generated outlines"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="space-y-4 mb-6">
        {generatedOutlines.map((outline, index) => (
          <OutlineCard
            key={index}
            outline={outline}
            onEdit={(newOutline) => {
              const updatedOutlines = [...generatedOutlines];
              updatedOutlines[index] = newOutline;
              setGeneratedOutlines(updatedOutlines);
            }}
            onDelete={() => {
              const updatedOutlines = generatedOutlines.filter(
                (_, i) => i !== index
              );
              setGeneratedOutlines(updatedOutlines);
            }}
          />
        ))}
      </div>
      <GenerationMenu
        instruction={outlineInstruction}
        setInstruction={setOutlineInstruction}
        count={numOutlines}
        setCount={setNumOutlines}
        onGenerate={handleGenerateOutlines}
        isLoading={isLoading}
        isRegeneration={true}
        generationType="outlines"
      />
    </div>
  );
};

const ChapterView = ({ chapter }) => {
  const { chapterActions, ebookState } = useEbook();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chapter.title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [outlineInstruction, setOutlineInstruction] = useState("");
  const [numOutlines, setNumOutlines] = useState(1);
  const [generatedOutlines, setGeneratedOutlines] = useState([]);

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

  const handleGenerateOutlines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let prev_outlines = chapter.sections.map((s) => s.outline);
      const context = {
        parameters: ebookState.parameters,
        chapter_synopsis: chapter.synopsis,
        previous_outlines: prev_outlines,
      };
      const outlines = await getSuggestedOutlines(
        context,
        outlineInstruction,
        numOutlines
      );
      setGeneratedOutlines(outlines.map((o) => o.outline));
    } catch (err) {
      console.error(err);
      setError("Failed to generate outlines. Please try again.");
    }
    setIsLoading(false);
  }, [
    chapter.synopsis,
    ebookState.parameters,
    numOutlines,
    outlineInstruction,
  ]);

  const handleReloadOutlines = async () => {
    await handleGenerateOutlines();
  };

  const handleAddOutlines = async () => {
    for (let outline of generatedOutlines) {
      await chapterActions.addSection(chapter.id, {
        outline: outline,
        paragraphs: [],
      });
    }
    setGeneratedOutlines([]);
  };

  const handleCloseOutlines = useCallback(() => {
    setGeneratedOutlines([]);
    setOutlineInstruction("");
  }, []);

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

      <h3 className="text-xl font-semibold my-4">Sections</h3>
      {chapter.sections.map((section, index) => (
        <Section
          key={section.id || index}
          section={section}
          index={index}
          chapterId={chapter.id}
        />
      ))}

      <GeneratedOutlinesSection
        generatedOutlines={generatedOutlines}
        outlineInstruction={outlineInstruction}
        setOutlineInstruction={setOutlineInstruction}
        numOutlines={numOutlines}
        setNumOutlines={setNumOutlines}
        handleGenerateOutlines={handleGenerateOutlines}
        handleReloadOutlines={handleReloadOutlines}
        handleAddOutlines={handleAddOutlines}
        handleCloseOutlines={handleCloseOutlines}
        setGeneratedOutlines={setGeneratedOutlines}
        isLoading={isLoading}
      />

      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default ChapterView;
