import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const CollapsiblePanel = ({ title, children, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-4 py-2 sm:px-6">
        <div
          className="flex items-center justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            {Icon && <Icon className="mr-2" />}
            {title}
          </h2>
          <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>
      {isOpen && <div className="px-4 pb-5 sm:p-6">{children}</div>}
    </div>
  );
};

export default CollapsiblePanel;
