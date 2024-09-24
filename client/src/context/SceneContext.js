// SceneContext.js
import React, { createContext, useContext } from "react";

const SceneContext = createContext();

export const useSceneContext = () => {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error("useSceneContext must be used within a SceneProvider");
  }
  return context;
};

export const SceneProvider = ({ children, value }) => {
  return (
    <SceneContext.Provider value={value}>{children}</SceneContext.Provider>
  );
};
