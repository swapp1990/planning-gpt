import React from "react";
import { FaCheck, FaSyncAlt, FaTimes } from "react-icons/fa";

const NewElementsControls = ({ newElements, onAccept, onReject, onReload }) => {
  if (newElements.length === 0) return null;

  return (
    <div className="mt-4 flex justify-end space-x-2">
      <button
        onClick={onAccept}
        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
      >
        <FaCheck className="mr-2" />
        Accept
      </button>
      <button
        onClick={onReload}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center"
      >
        <FaSyncAlt className="mr-2" />
        Reload
      </button>
      <button
        onClick={onReject}
        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 flex items-center"
      >
        <FaTimes className="mr-2" />
        Reject
      </button>
    </div>
  );
};

export default NewElementsControls;
