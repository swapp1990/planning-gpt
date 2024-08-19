import React, { useState, useRef, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
function TestPage() {
  const MessageComponent = ({ paragraphs, isLoading }) => {
    return (
      <div className="p-4 border-b border-gray-200">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="h-32 text-gray-800 mb-2">
            {paragraph}
          </p>
        ))}
        {isLoading && (
          <div className="mt-2 flex justify-center">
            <FaSpinner className="animate-spin text-gray-600" size={32} />
          </div>
        )}
      </div>
    );
  };
  const [messages, setMessages] = useState(
    Array(5)
      .fill()
      .map((_, i) => [`Initial message ${i + 1}`])
  );
  // const [messages, setMessages] = useState([]);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(null);

  useEffect(() => {
    // Simulate adding paragraphs to the first message after 1 second
    const interval = setInterval(() => {
      if (messages[0].length < 11) {
        setLoadingMessageIndex(0);
        setTimeout(() => {
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            newMessages[0] = [
              ...newMessages[0],
              `Added paragraph ${newMessages[0].length}`,
            ];
            return newMessages;
          });
          setLoadingMessageIndex(null);
        }, 1000); // Simulate a 1-second load time per paragraph
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto bg-gray-100 p-4">
      {messages.map((paragraphs, index) => (
        <MessageComponent
          key={index}
          paragraphs={paragraphs}
          isLoading={loadingMessageIndex === index}
        />
      ))}
    </div>
  );
}

export default TestPage;
