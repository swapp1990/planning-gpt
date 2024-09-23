import React from "react";
import { FaCheck, FaSyncAlt, FaTimes } from "react-icons/fa";

const DraftSceneControls = ({
  isGenerating,
  onFinalize,
  onCancel,
  onReload,
}) => {
  if (isGenerating) return null;

  return (
    <div className="flex space-x-2">
      <button
        onClick={onFinalize}
        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
      >
        <FaCheck className="mr-2" />
        Finalize
      </button>
      <button
        onClick={onReload}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
      >
        <FaSyncAlt className="mr-2" />
        Reload
      </button>
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 flex items-center"
      >
        <FaTimes className="mr-2" />
        Cancel
      </button>
    </div>
  );
};

export default DraftSceneControls;
