import React, { useState } from "react";

const VersionedText = ({ text }) => {
  const [isShowingPrevious, setIsShowingPrevious] = useState(false);

  const toggleText = () => {
    setIsShowingPrevious((prev) => !prev);
  };

  return (
    <div className="relative p-4 rounded-lg bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg shadow-inner text-md text-left">
      <p>{isShowingPrevious ? text.previous : text.current}</p>
      <button
        className={`mt-4 p-2 text-white rounded-lg transition-all duration-300 ${
          isShowingPrevious ? "bg-gray-800" : "bg-gray-500"
        } hover:shadow-lg`}
        onClick={toggleText}
      >
        {isShowingPrevious ? "Show Current" : "Show Previous"}
      </button>
    </div>
  );
};

export default VersionedText;
