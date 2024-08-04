import React, { useState, useEffect, useRef } from "react";
import "./swiper.css";

const Swiper = ({ posts }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef();

  const handleSwipe = (direction) => {
    if (direction === "left" && activeIndex < posts.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (direction === "right" && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  useEffect(() => {
    const swiper = swiperRef.current;

    const handleSwipeStart = (e) => {
      e.stopPropagation();
      swiper.startX = e.touches[0].clientX;
    };

    const handleSwipeMove = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (swiper.isSwiping) {
        swiper.endX = e.touches[0].clientX;
        const diff = Math.abs(swiper.startX - swiper.endX);

        // Set a threshold for swipes (e.g. 100 pixels)
        if (diff > 100) {
          const direction = swiper.startX > swiper.endX ? "left" : "right";
          handleSwipe(direction);
          swiper.startX = swiper.endX; // Reset the starting point for the next swipe
        }
      }
      swiper.isSwiping = true;
    };

    const handleSwipeEnd = (e) => {
      e.stopPropagation();
      swiper.isSwiping = false;
    };

    swiper.addEventListener("touchstart", handleSwipeStart);
    swiper.addEventListener("touchmove", handleSwipeMove);
    swiper.addEventListener("touchend", handleSwipeEnd);

    return () => {
      swiper.removeEventListener("touchstart", handleSwipeStart);
      swiper.removeEventListener("touchmove", handleSwipeMove);
      swiper.removeEventListener("touchend", handleSwipeEnd);
    };
  }, [activeIndex, posts.length]);

  return (
    <div className="swiper" ref={swiperRef}>
      {posts.map((post, index) =>
        post.status ? (
          <div
            key={index}
            className={`swiper-text swiper-image ${
              index === activeIndex ? "active" : ""
            }`}
          >
            {post.status}
          </div>
        ) : (
          post.url && (
            <img
              key={index}
              src={post.url}
              alt={`Swipe image ${index}`}
              className={`swiper-image ${
                index === activeIndex ? "active" : ""
              }`}
            />
          )
        )
      )}
      {posts.length > 1 && (
        <div className="swiper-dots">
          {posts.map((p, index) => (
            <span
              key={index}
              onClick={() => {
                setActiveIndex(index);
              }}
              onMouseOver={(event) => (event.target.style.opacity = 0.7)}
              onMouseOut={(event) => (event.target.style.opacity = 1)}
              className={`swiper-dot ${index === activeIndex ? "active" : ""} ${
                p.status ? "processing" : ""
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Swiper;
