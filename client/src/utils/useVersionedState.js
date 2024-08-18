import { useState, useRef } from "react";

const useVersionedState = (initialValue) => {
  const [current, setCurrent] = useState(initialValue);
  const previous = useRef(initialValue);

  const setVersionedState = (newValue) => {
    previous.current = current; // Store the current value in the ref before updating
    setCurrent(newValue);
  };

  return [current, setVersionedState, previous.current];
};

export default useVersionedState;
