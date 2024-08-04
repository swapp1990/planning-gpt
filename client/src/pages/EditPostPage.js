import React, { useEffect, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  FaEllipsisH,
  FaRegHeart,
  FaHeart,
  FaRegComment,
  FaPaperPlane,
  FaRegBookmark,
  FaBookmark,
  FaList,
} from "react-icons/fa";
import axios from "axios";
import { useSelector } from "react-redux";
import store from "../stores";
import { setUsername, setToken } from "../stores/UserStore";
import { saveImage } from "../server/users";
import InteractiveIcon from "../components/InteractiveIcon";
import Swiper from "../components/Swiper";

axios.defaults.baseURL = "https://09ed1e24ce6e.ngrok.app/api";

const EditPostPage = () => {
  const history = useHistory();
  const { postId } = useParams();
  const location = useLocation();
  const username = useSelector((state) => state.user.username);
  const token = useSelector((state) => state.user.token);

  const [post, setPost] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (postId) {
      async function fetchPost() {
        try {
          const response = await axios.get(`/sdxl/task/${postId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log(response.data);
          setPost(response.data);
          setPrompt(response.data.prompt);
        } catch (error) {
          console.error("An error occurred while fetching post data:", error);
        }
      }
      fetchPost();
    } else {
      // Placeholder post
      setPost({});
    }
  }, [postId]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {}, [username]);

  useEffect(() => {
    if (location.state && location.state.prompt) {
      setPrompt(location.state.prompt);
    }
  }, [location]);

  useEffect(() => {
    const interval = setInterval(async () => {
      setTasks(
        await Promise.all(
          tasks.map(async (task) => {
            if (task.status !== "SUCCESS") {
              const response = await axios.get(
                `/sdxl/generate/image/status/${task.taskId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (response.data.status === "SUCCESS") {
                return {
                  ...task,
                  status: response.data.status,
                  result: response.data.result,
                };
              } else {
                return task;
              }
            } else {
              if (task.regeneratedTasks) {
                let processingTasks = task.regeneratedTasks.filter(
                  (regenTask) => regenTask.status !== "SUCCESS"
                );
                let successTasks = task.regeneratedTasks.filter(
                  (regenTask) => regenTask.status === "SUCCESS"
                );
                if (processingTasks.length > 0) {
                  //   console.log("processingTasks", processingTasks);
                  let newRegeneratedTasks = await Promise.all(
                    processingTasks.map(async (regenTask) => {
                      const response = await axios.get(
                        `/sdxl/generate/image/status/${regenTask.taskId}`,
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );
                      if (response.data.status === "SUCCESS") {
                        return {
                          ...regenTask,
                          status: response.data.status,
                          result: response.data.result,
                        };
                      } else {
                        return regenTask;
                      }
                    })
                  );
                  //   console.log("newRegeneratedTasks", newRegeneratedTasks);
                  let mergedTasks = [...successTasks, ...newRegeneratedTasks];
                  return {
                    ...task,
                    regeneratedTasks: mergedTasks,
                  };
                }
              }
              return task;
            }
          })
        )
      );
    }, 4000); // Check status every second

    return () => clearInterval(interval); // Clean up on unmount or when tasks changes
  }, [tasks]);

  const init = async () => {
    let cacheLogin = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!cacheLogin || !cacheLogin.username) {
      history.push("/login");
    } else {
      store.dispatch(setUsername(cacheLogin.username));
      store.dispatch(setToken(cacheLogin.token));
    }
  };

  const handleInputChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleGenerateImage = async () => {
    setError(null);
    let response;
    try {
      response = await axios.post(
        "/sdxl/generate/image",
        {
          prompt: prompt,
          seed: post.sdxlSeed,
          subseed_strength: 0.1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error generating image:", error);
      setError("Error generating image. Please try again later.");
      return;
    }

    if (!response) {
      setError("Error generating image. Please try again later.");
      return;
    }
    if (response.data.task) {
      let newTask = response.data.task;
      setTasks((oldTasks) => [...oldTasks, newTask]);
    } else {
      setError(response.data.responseResult);
    }
  };

  const saveImageToS3 = async (taskToSave) => {
    try {
      setTasks((oldTasks) =>
        oldTasks.map((task) => {
          if (task.taskId === taskToSave.taskId) {
            return { ...task, saving: true };
          }
          return task;
        })
      );

      let response = await saveImage({ taskId: taskToSave.taskId }, token);

      if (response.error) {
        console.error(response.error);
        setTasks((oldTasks) =>
          oldTasks.map((task) => {
            if (task.taskId === taskToSave.taskId) {
              return { ...task, saving: false };
            }
            return task;
          })
        );
        return;
      }
      console.log({ response });
      setTasks((oldTasks) =>
        oldTasks.map((task) => {
          if (task.taskId === taskToSave.taskId) {
            return { ...task, saving: false, saved: true };
          }
          return task;
        })
      );
    } catch (error) {
      setTasks((oldTasks) =>
        oldTasks.map((task) => {
          if (task.taskId === taskToSave.taskId) {
            return { ...task, saving: false };
          }
          return task;
        })
      );
      console.error(error);
    }
  };

  const regenerateImageWithSameSeed = async (taskToRegenerate) => {
    try {
      //   console.log({ taskToRegenerate });
      let response = await axios.post(
        "/sdxl/generate/image/regenerate",
        {
          prompt: taskToRegenerate.result.prompt,
          seed: taskToRegenerate.result.seed,
          subseed_strength: 0.1,
          taksId: taskToRegenerate.taskId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      //   let sampleResponse = {
      //     data: {
      //       regeneratedTask: {
      //         taskId: "123456789",
      //         status: "PROCESSING",
      //       },
      //     },
      //   };
      //   let response = sampleResponse;
      if (response.data.task) {
        //find the original task and add regeneratedTask to regenerated list. If no regenerated list exists, create one
        setTasks((oldTasks) => {
          let newTasks = oldTasks.map((task) => {
            if (task.taskId === taskToRegenerate.taskId) {
              if (task.regeneratedTasks) {
                return {
                  ...task,
                  regeneratedTasks: [
                    ...task.regeneratedTasks,
                    response.data.task,
                  ],
                };
              } else {
                return {
                  ...task,
                  regeneratedTasks: [response.data.task],
                };
              }
            }
            return task;
          });
          return newTasks;
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoPrompts = (prompt) => {
    history.push({
      pathname: "/prompts",
    });
  };

  const renderTask = (task, index) => {
    let posts = [];
    if (task.status !== "SUCCESS") {
      posts.push({
        status: task.status,
      });
    } else {
      let img = `data:image/png;base64,${task.result.image}`;
      posts.push({
        url: img,
      });
      if (task.regeneratedTasks) {
        task.regeneratedTasks.map((regenTask, idx) => {
          if (regenTask.status !== "SUCCESS") {
            posts.push({
              status: regenTask.status,
            });
          } else {
            let img = `data:image/png;base64,${regenTask.result.image}`;
            posts.push({
              url: img,
            });
          }
        });
      }
    }
    task.posts = posts;
    return (
      <div className="mt-2 overflow-hidden" style={{ height: "auto" }}>
        <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl mb-2">
          <div>
            <Swiper posts={task.posts} />
          </div>
          <div className="flex justify-between items-center py-2 px-2">
            <div className="flex space-x-4">
              <InteractiveIcon
                icon={FaRegHeart}
                activeIcon={FaHeart}
                isActive={task.saved}
                onToggle={() => saveImageToS3(task)}
                toggleText={task.saving ? "Saving..." : "Save"}
              />
              <InteractiveIcon
                icon={FaPaperPlane}
                activeIcon={FaPaperPlane}
                onToggle={() => regenerateImageWithSameSeed(task)}
                toggleText="Regenerate"
              />
            </div>
            <div
              className="pb-2 overflow-hidden text-ellipsis"
              style={{ width: "100px", height: "30px" }}
              onClick={() => setPrompt(task.prompt)}
            >
              <p className="text-darkgrey text-xs md:text-base">
                {task.prompt}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PromptInputWindow = (
    <div className="bg-white py-2 px-4 shadow sm:rounded-lg sm:px-10">
      <div>
        <label
          htmlFor="prompt"
          className="block text-sm font-medium text-gray-700"
        >
          Prompt for {post && post.sdxlSeed}
        </label>
        <div className="mt-1">
          <textarea
            id="prompt"
            name="prompt"
            rows="3"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md p-2"
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div className="mt-6">
        <div className="flex">
          <button
            type="button"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={handleGenerateImage}
          >
            Generate Image
          </button>
          <button className="ml-4 " onClick={() => handleGoPrompts()}>
            <FaList size={24} />
          </button>
        </div>

        {error && (
          <div className="mt-2">
            <p className="text-center text-sm text-red-500">{error}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-grow mb-20">
      <div className="flex-shrink-0 w-full sm:mx-auto sm:max-w-md">
        {PromptInputWindow}
      </div>
      <div className="flex-grow overflow-y-auto">
        {tasks.slice().reverse().map(renderTask)}
      </div>
    </div>
  );
};

export default EditPostPage;
