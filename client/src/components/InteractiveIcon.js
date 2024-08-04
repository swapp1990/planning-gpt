import React from "react";

const InteractiveIcon = ({
  icon: Icon,
  activeIcon: ActiveIcon,
  toggleText,
  isActive,
  onToggle,
}) => {
  return (
    <button className="group" onClick={onToggle}>
      {isActive ? (
        <ActiveIcon className="text-2xl md:text-3xl text-red-500" />
      ) : (
        <Icon className="text-2xl md:text-3xl" />
      )}
      <span className="absolute text-xs text-gray-500 opacity-0 group-hover:opacity-100">
        {toggleText}
      </span>
    </button>
  );
};

export default InteractiveIcon;
