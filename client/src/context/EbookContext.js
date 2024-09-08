import React, { createContext, useContext } from "react";
import { useEbookState } from "../hooks/useEbookState";

const EbookContext = createContext(null);

export const EbookProvider = ({ children }) => {
  const ebookState = useEbookState();
  return (
    <EbookContext.Provider value={ebookState}>{children}</EbookContext.Provider>
  );
};

export const useEbook = () => {
  const context = useContext(EbookContext);
  if (context === undefined) {
    throw new Error("useEbook must be used within a EbookProvider");
  }
  return context;
};
