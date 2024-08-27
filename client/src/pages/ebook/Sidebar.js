const Sidebar = ({
  chapters,
  currentChapter,
  navigateChapter,
  isOpen,
  onClose,
}) => {
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
          <h2 className="text-xl font-semibold">Chapters</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        <ul className="p-4 overflow-auto h-full">
          {chapters.map((chapter) => (
            <li key={chapter.id} className="mb-2">
              <button
                onClick={() => navigateChapter(chapter.id)}
                className={`w-full text-left p-2 rounded ${
                  currentChapter === chapter.id
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {chapter.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default Sidebar;
