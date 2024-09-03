import React from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

const Sidebar = ({
  items,
  currentItem,
  onItemClick,
  isOpen,
  onClose,
  title,
  onNewItem,
  onDeleteItem,
}) => {
  const handleDelete = (e, item) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete this ${title.slice(0, -1)}?`
      )
    ) {
      onDeleteItem(item.id || item.title);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        ></div>
      )}
      <nav
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        <div className="p-4">
          {onNewItem && (
            <button
              onClick={onNewItem}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <FaPlus className="mr-2" />
              New {title.slice(0, -1)}
            </button>
          )}
        </div>
        <ul className="p-4 overflow-auto h-full">
          {items.map((item) => (
            <li key={item.id || item.title} className="mb-2">
              <button
                onClick={() => onItemClick(item.id || item.title)}
                className={`w-full text-left p-2 rounded flex justify-between items-center ${
                  currentItem === item.id || currentItem === item.title
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <div>
                  <span>{item.title}</span>
                  {item.lastModified && (
                    <span className="text-xs block text-black">
                      Last modified:{" "}
                      {new Date(item.lastModified).toLocaleString()}
                    </span>
                  )}
                </div>
                {onDeleteItem && (
                  <button
                    onClick={(e) => handleDelete(e, item)}
                    className={`text-red-500 hover:text-red-700 ${
                      currentItem === item.id || currentItem === item.title
                        ? "text-white hover:text-red-200"
                        : ""
                    }`}
                  >
                    <FaTrash />
                  </button>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default Sidebar;
