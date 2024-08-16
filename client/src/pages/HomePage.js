import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

function HomePage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { role: "user", content: input };
      setMessages([...messages, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const response = await fetch("http://localhost:5000/hermes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: input }),
        });

        const data = await response.json();
        console.log(data);
        const aiResponse = { role: "ai", content: data.result };
        setMessages([...messages, userMessage, aiResponse]);
      } catch (error) {
        console.error("Error fetching AI response:", error);
        const aiErrorResponse = {
          role: "ai",
          content: "Sorry, something went wrong. Please try again later.",
        };
        setMessages([...messages, userMessage, aiErrorResponse]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-grow bg-gray-100 h-full mb-14">
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${
              msg.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-black"
              }`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="mb-4 text-left">
            <div className="inline-block p-2 rounded-lg bg-gray-300 text-black">
              Loading...
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex mx-20">
          <input
            type="text"
            className="flex-grow p-2 border border-gray-300 rounded-lg"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
          />
          <button
            className="ml-2 p-2 bg-blue-500 text-white rounded-lg"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
