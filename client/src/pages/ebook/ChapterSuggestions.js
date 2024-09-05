import { FaTimes, FaTrash, FaPlus } from "react-icons/fa";
import { useEbookStorage } from "../../utils/storage";

const ChapterSuggestions = ({
  chapters,
  suggestions,
  isLoading,
  error,
  onAddChapter,
  onReload,
  onClose,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Chapter Planner</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          &times;
        </button>
      </div>

      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Current Chapters
        </h3>
        {chapters.length > 0 ? (
          <div className="space-y-4">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500"
              >
                <h4 className="text-lg font-medium text-blue-800">
                  Chapter {index + 1}: {chapter.title}
                </h4>
                <p className="text-sm text-gray-600 mt-2">{chapter.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No chapters created yet.</p>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Suggested Chapters
        </h3>
        {suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.title}
                className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-medium text-green-800">
                    Chapter {chapters.length + index + 1}: {suggestion.title}
                  </h4>
                  <button
                    onClick={() => onAddChapter(suggestion)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <p className="text-sm text-gray-600">{suggestion.synopsis}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No suggestions available.</p>
        )}
      </div>

      <button
        onClick={onReload}
        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          "Reload"
        )}
      </button>
    </div>
  );
};

export default ChapterSuggestions;
