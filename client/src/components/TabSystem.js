import React, { useState } from "react";

const TabSystem = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="flex border-b border-gray-200 mb-2 sm:mb-6">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`flex items-center py-2 px-4 text-sm font-medium ${
              activeTab === index
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.icon && <tab.icon className="mr-2 sm:mr-2" />}
            <span className="hidden sm:inline">{tab.title}</span>
          </button>
        ))}
      </div>
      <div>{tabs[activeTab].content}</div>
    </div>
  );
};

export default TabSystem;
