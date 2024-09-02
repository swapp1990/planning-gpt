import React, { useState, useEffect, useRef } from "react";

function TestPage() {
  const [prompt, setPrompt] = useState("What is your purpose?");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a smart agent who generates 3 paragraphs for any prompt"
  );
  const [examples, setExamples] = useState("");
  const [parameters, setParameters] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const eventSourceRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse("");

    const payload = {
      prompt,
      system_prompt: systemPrompt,
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/hermes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          lines.forEach((line) => {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              setResponse((prevResponse) => prevResponse + data);
            }
          });
        }
      } else {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error("Error:", error);
      setResponse("An error occurred while fetching the response.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Hermes API Test</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block mb-1">
            Prompt:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 border rounded"
            rows="3"
          />
        </div>
        <div>
          <label htmlFor="systemPrompt" className="block mb-1">
            System Prompt:
          </label>
          <textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-2 border rounded"
            rows="3"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isLoading ? "Generating..." : "Generate"}
        </button>
      </form>
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Response:</h2>
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
          {response || "No response yet."}
        </pre>
      </div>
    </div>
  );
}

export default TestPage;
