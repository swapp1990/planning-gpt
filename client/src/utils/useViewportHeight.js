import { useState, useEffect, useCallback } from "react";

function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleResize = useCallback(() => {
    const newViewportHeight = window.innerHeight;
    const currentScrollY = window.scrollY;
    const currentDocumentHeight = document.documentElement.scrollHeight;

    // Calculate the difference in height
    const heightDifference = viewportHeight - newViewportHeight;

    // Update the viewport height
    setViewportHeight(newViewportHeight);

    // Adjust scroll position to maintain relative position
    if (heightDifference !== 0) {
      const newScrollPosition = currentScrollY + heightDifference;
      window.scrollTo(0, newScrollPosition);
      setScrollPosition(newScrollPosition);
    }
  }, [viewportHeight]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  return viewportHeight;
}

export default useViewportHeight;
