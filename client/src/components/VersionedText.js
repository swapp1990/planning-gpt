import React, { useState } from "react";

const VersionedText = ({ text }) => {
  const [isShowingPrevious, setIsShowingPrevious] = useState(false);

  const toggleText = () => {
    setIsShowingPrevious((prev) => !prev);
  };

  return (
    <div className="relative p-4 rounded-lg">
      <p>{isShowingPrevious ? text.previous : text.current}</p>
      <button
        className={`mt-2 p-2 text-white rounded-lg transition-all duration-300 ${
          isShowingPrevious ? "bg-gray-800" : "bg-gray-500"
        }`}
        onClick={toggleText}
      >
        {isShowingPrevious ? "Show Current" : "Show Previous"}
      </button>
    </div>
  );
};

export default VersionedText;
