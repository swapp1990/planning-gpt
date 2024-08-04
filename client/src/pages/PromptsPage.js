import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHome, FaRegEye } from "react-icons/fa";
import axios from "axios";

const PromptsPage = () => {
  const history = useHistory();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPrompt, setExpandedPrompt] = useState(null);
  const username = useSelector((state) => state.user.username);
  const token = useSelector((state) => state.user.token);

  useEffect(async () => {
    setLoading(true);
    let prompts = await getPrompts();
    console.log({ prompts });
    // console.log({ images });
    setPrompts(prompts);
    setLoading(false);
  }, []);

  async function getPrompts() {
    let response = await axios.get("/sdxl/generate/prompts", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response.data);
    response = response.data;
    return response;
  }

  const handleGoHome = (prompt) => {
    history.push({
      pathname: "/",
      state: { prompt: prompt },
    });
  };

  const handleGoPostPage = (prompt) => {
    history.push(`/post/${prompt}`);
  };

  return (
    <div className="p-4 sm:mx-auto w-full sm:max-w-md">
      <button onClick={() => handleGoHome("")}>
        <FaHome size={24} />
      </button>
      <h1 className="text-2xl font-bold mb-4">All Prompts</h1>
      <div className="flex-grow overflow-y-auto max-h-[500px] border-gray-400 border-2 p-2">
        <ul>
          {prompts
            .slice()
            .reverse()
            .map((p, index) => (
              <li key={index} className="mb-2 flex">
                <div
                  className={`border m-2 flex-grow rounded text-ellipsis overflow-hidden ${
                    expandedPrompt === index ? "h-auto" : "h-6"
                  }`}
                  onClick={() =>
                    setExpandedPrompt(expandedPrompt === index ? null : index)
                  }
                >
                  {p.prompt}
                </div>
                <button onClick={() => handleGoHome(p.prompt)}>
                  <FaHome size={24} />
                </button>
                {p.id && (
                  <button
                    className="ml-2"
                    onClick={() => handleGoPostPage(p.id)}
                  >
                    <FaRegEye size={24} />
                  </button>
                )}
              </li>
            ))}
        </ul>
        {loading && (
          <div className="text-2xl font-bold text-gray-500">Loading...</div>
        )}
      </div>
    </div>
  );
};

export default PromptsPage;
