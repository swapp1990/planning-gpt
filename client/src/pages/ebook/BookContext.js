// BookContext.js
import React from "react";

const BookContext = React.createContext();

export const BookProvider = ({ children, value }) => (
  <BookContext.Provider value={value}>{children}</BookContext.Provider>
);

export const useBook = () => React.useContext(BookContext);
