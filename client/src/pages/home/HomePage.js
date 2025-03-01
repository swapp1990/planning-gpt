import React, { useState, useRef, useEffect } from "react";
import { FiMenu } from "react-icons/fi";
import {
  FaPaperPlane,
  FaEdit,
  FaKeyboard,
  FaRegFileAlt,
  FaSave,
  FaSpinner,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";

import InputPopup from "../../components/InputPopup";
import VersionedText from "../../components/VersionedText";
import useVersionedState from "../../utils/useVersionedState";
import AssistantChat from "./AssistantChat";
import UserChat from "./UserChat";

function HomePage() {
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatSummary, setChatSummary, previousChatSummary] =
    useVersionedState("Test Summary");
  const [loading, setLoading] = useState(false);
  const [systemPrompts, setSystemPrompts] = useState([]);
  const [chatType, setChatType] = useState("writing_assistant");
  const [parameters, setParameters] = useState([]);

  const assistantResponse = `Elena hesitated at the threshold, her fingers trembling as they traced the outline of the faded brass doorknob. The wooden door creaked open with a groan, echoing through the silent corridors like a long-forgotten sigh. Dust motes danced in the pale light filtering through the cracked windows, casting a hazy veil over the once-vibrant home. Her breath caught in her throat as she stepped inside, the floorboards beneath her feet creaking in protest at the unfamiliar weight.

Every corner of the house seemed to whisper her name, calling her back to a time when laughter filled these walls. Now, the air was thick with the scent of decay and abandonment, mingling with the faintest hint of her mother's lavender perfume, a fragrance that lingered like a ghost, refusing to fade completely.

She wandered through the rooms, each one a hollow shell of its former self. The living room, where her mother had once sat by the fire, knitting and humming softly, was now barren, the fireplace cold and lifeless. The kitchen, where the warmth of homemade meals had once embraced her, was a stark reminder of the emptiness that had taken its place.

It was in her mother’s bedroom that Elena finally stopped, her gaze falling upon the small music box resting on the dusty vanity. The delicate silver filigree was tarnished, but the intricate design still held the beauty she remembered. With a trembling hand, she lifted the lid. The mechanism inside whirred to life, and the familiar notes of the lullaby began to play, soft and haunting.

The melody wrapped around her like a forgotten embrace, and memories surged forward—nights when her mother would sit by her bed, winding the music box as she drifted off to sleep. The lullaby had been a constant in her childhood, a promise of safety, of love that would never wane. But now, it was a painful reminder of all that she had lost.

Tears welled in Elena’s eyes, blurring the room around her. She clutched the music box to her chest, its melody mingling with the sobs she could no longer hold back. The house, once filled with life and warmth, was now a mausoleum of memories, and as the final notes of the lullaby faded into the silence, she knew that this was the last time she would ever come back.

She gently closed the music box, the finality of the action echoing in the stillness, and as she turned to leave, she felt the weight of the past settle around her like a shroud, a burden she would carry long after she walked out the door.`;

  // const examples = [
  //   {
  //     user: "What is the premise of the novel?",
  //     assistant: "Test",
  //   },
  // ];

  useEffect(() => {
    console.log("init HomePage");
    init();
  }, []);

  const init = async () => {
    await loadSystemPrompts(chatType);

    // simulateStreamingResponse();

    setTimeout(() => {
      // sendTestStreamingResponse();
    }, 1000);
  };

  const loadSystemPrompts = async (chatType) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/prompt/system?type=${chatType}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setSystemPrompts(data.prompts);
      let parameters = [];
      parameters.push({
        title: "System Prompts",
        points: data.prompts
      });
      parameters = [...parameters, ...data.parameters];
      setParameters(parameters);
    } catch (error) {
      console.error("Error fetching system prompt:", error);
    }
  };

  const handleSend = async (input) => {
    console.log(input);
    if (input.trim()) {
      const userMessage = { role: "user", content: input };
      setMessages([userMessage, ...messages]);
      setLoading(true);

      let processedParameters = parameters.reduce((acc, section) => {
        acc[section.title] = section.points;
        return acc;
      }, {});

      let parametersString = JSON.stringify(processedParameters);
      // Get list of previous assistant responses
      const assistantResponses = messages
        .filter((msg) => msg.role === "assistant")
        .map((msg) => msg.content);

      let previousResponses = [];
      // for (let i = 0; i < assistantResponses.length; i++) {
      //   previousResponses.push({ assistant: assistantResponses[i] });
      // }

      generateAssistantResponse(input, systemPrompts[0], previousResponses, "");
    }
  };

  const generateAssistantResponse = async (
    input,
    systemPrompt,
    previousResponses,
    parametersString
  ) => {
    // console.log(input);
    try {
      const aiResponse = {
        role: "ai",
        content: "",
        summary: "",
        streaming: true,
      };

      setMessages((prevMessages) => [aiResponse, ...prevMessages]);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/hermes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          system_prompt: systemPrompt,
          examples: previousResponses,
          parameters: parametersString,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let partialText = "";
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("Stream complete");

          break;
        }

        partialText += decoder.decode(value, { stream: true });
        const lines = partialText.split("\n\n");
        partialText = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            let chunk = line.replace("data: ", "");
            if (chunk.startsWith("[DONE]")) {
              // console.log("Final response:", chunk.replace("[DONE] ", ""));
              console.log(chunk);
              setMessages((prevMessages) =>
                prevMessages.map((msg, index) =>
                  index === 0
                    ? {
                        ...msg,
                        content: msg.content + " " + chunk,
                        streaming: false,
                      }
                    : msg
                )
              );
            } else {
              // console.log("Partial response:", chunk);
              chunk += "\n\n";
              // const aiResponse = {
              //   role: "ai",
              //   content: data.passage,
              //   summary: data.summary,
              // };
              // setMessages([aiResponse, userMessage, ...messages]);
              setMessages((prevMessages) =>
                prevMessages.map((msg, index) =>
                  index === 0
                    ? {
                        ...msg,
                        content: msg.content + " " + chunk,
                        streaming: true,
                      }
                    : msg
                )
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
      // const aiErrorResponse = {
      //   role: "ai",
      //   content: "Sorry, something went wrong. Please try again later.",
      // };
      // setMessages([...messages, userMessage, aiErrorResponse]);
    } finally {
      // setLoading(false);
    }
  };

  const sendTestStreamingResponse = () => {
    const userMessage = {
      role: "user",
      content: "Alex is talking with his friend Samuel",
    };
    setMessages([userMessage, ...messages]);

    generateAssistantResponse(userMessage.content, systemPrompt, [], "");
  };

  const simulateStreamingResponse = () => {
    // Simulate adding paragraphs to the first message after 1 second
    const interval = setInterval(() => {
      setMessages((prevMessages) => {
        if (prevMessages.length === 0) {
          let userChat = {
            role: "user",
            content: "Alex is talking with his friend Layla",
          };
          let aiChat = {
            role: "ai",
            content: "AI is responding to Alex's conversation",
            streaming: true,
          };
          return [userChat, aiChat];
        }

        if (
          prevMessages.length > 0 &&
          prevMessages[1].content.split("\n\n").length < 14
        ) {
          // Add more paragraphs
          let exampleParagraph = `Elena hesitated at the threshold, her fingers trembling as they traced the outline of the faded brass doorknob. The wooden door creaked open with a groan, echoing through the silent corridors like a long-forgotten sigh. Dust motes danced in the pale light filtering through the cracked windows, casting a hazy veil over the once-vibrant home. Her breath caught in her throat as she stepped inside, the floorboards beneath her`;

          let paragraphText = `Added paragraph ${
            prevMessages[1].content.split("\n\n").length
          } - ${exampleParagraph}`;

          const aiMessage = {
            role: "ai",
            content: prevMessages[1].content + "\n\n" + paragraphText,
            streaming:
              prevMessages[1].content.split("\n\n").length == 13 ? false : true,
          };

          const newMessages = [...prevMessages];
          newMessages[1] = aiMessage;

          return newMessages;
        } else {
          clearInterval(interval);
          return prevMessages;
        }
      });
    }, 1000);
  };

  // const AIMessage = React.forwardRef(
  //   ({ message, msgIndex, onParagraphUpdate }, ref) => {
  //     const [updatedParagraphs, setUpdatedParagraphs] = useState(
  //       message.content.split("\n\n")
  //     );
  //     const [popupVisible, setPopupVisible] = useState(false);
  //     const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  //     const [paraUpdatePrompt, setParaUpdatePrompt] = useState("");
  //     const [selectedParagraphIndex, setSelectedParagraphIndex] =
  //       useState(null);
  //     const [msgLoading, setMsgLoading] = useState(false);

  //     const messageRef = useRef(null);
  //     const scrollPosition = useRef(0);

  //     useEffect(() => {
  //       if (messageRef.current) {
  //         scrollPosition.current = messageRef.current.scrollTop;
  //       }
  //     }, [updatedParagraphs]);

  //     useEffect(() => {
  //       if (messageRef.current) {
  //         messageRef.current.scrollTop = scrollPosition.current;
  //       }
  //     }, [updatedParagraphs]);

  //     useEffect(() => {
  //       // console.log("init AIMessage");
  //     }, []);

  //     React.useImperativeHandle(ref, () => ({
  //       updateMsgLoading(loading) {
  //         setMsgLoading(loading);
  //       },
  //       updatedSelectedParagraphIndex(index) {
  //         setSelectedParagraphIndex(index);
  //       },
  //     }));

  //     const handleParagraphClick = async (index) => {
  //       if (loading) return;

  //       const viewportWidth = window.innerWidth;
  //       const viewportHeight = window.innerHeight;

  //       const popupWidth = 280;
  //       const popupHeight = 240;

  //       let x = event.clientX;
  //       let y = event.clientY;

  //       if (y - popupHeight < 0) {
  //         y = popupHeight;
  //       }

  //       if (x - popupWidth < 0) {
  //         x = popupWidth / 2;
  //       }

  //       setPopupPosition({ x, y });
  //       setPopupVisible(true);
  //       setSelectedParagraphIndex(index);
  //     };

  //     const handlePromptSubmit = async () => {
  //       if (loading || selectedParagraphIndex === null) return;

  //       setMsgLoading(true);
  //       setPopupVisible(false);
  //       const paragraph = updatedParagraphs[selectedParagraphIndex];
  //       let response = await onParagraphUpdate(
  //         paragraph,
  //         paraUpdatePrompt,
  //         message.content
  //       );

  //       const newParagraphs = [...updatedParagraphs];
  //       newParagraphs[selectedParagraphIndex] = response.updatedParagraph;
  //       // console.log(response.updatedParagraph);
  //       // setUpdatedParagraphs(newParagraphs);
  //       setMessages((prevMessages) => {
  //         const updatedMessages = [...prevMessages];
  //         updatedMessages[msgIndex].content = newParagraphs.join("\n\n");
  //         return updatedMessages;
  //       });

  //       setChatSummary(response.summary);
  //       setMsgLoading(false);

  //       setParaUpdatePrompt("");
  //     };

  //     const handlePromptCancel = () => {
  //       if (loading || selectedParagraphIndex === null) return;
  //       setMsgLoading(false);
  //       setPopupVisible(false);
  //       setParaUpdatePrompt("");
  //       setSelectedParagraphIndex(-1);
  //     };

  //     return (
  //       <div className="mb-4 text-left bg-gray-300 w-[90%] lg:w-[50%] flex flex-col">
  //         {msgLoading && selectedParagraphIndex === -1 && (
  //           <div className="absolute inset-0 flex items-center justify-center bg-gray-300 bg-opacity-75 z-10">
  //             <div className="text-center">
  //               <FaSpinner className="animate-spin text-gray-600" size={32} />
  //             </div>
  //           </div>
  //         )}
  //         {updatedParagraphs.map(
  //           (paragraph, index) =>
  //             paragraph !== "" && (
  //               <div
  //                 key={index}
  //                 className={`inline-block p-4 pr-10 rounded-lg mb-4 cursor-pointer relative transition-all duration-300 ease-in-out transform hover:scale-105 text-white shadow-lg ${
  //                   selectedParagraphIndex === index
  //                     ? "bg-gradient-to-r from-green-400 to-blue-400 border-l-4 border-green-500"
  //                     : "bg-gradient-to-r from-purple-500 to-pink-600"
  //                 }`}
  //                 onClick={() => handleParagraphClick(index)}
  //               >
  //                 {msgLoading && selectedParagraphIndex == index && (
  //                   <div className="absolute inset-0 flex items-center justify-center bg-gray-300 bg-opacity-50">
  //                     <FaSpinner
  //                       className="animate-spin text-gray-600"
  //                       size={32}
  //                     />
  //                   </div>
  //                 )}
  //                 <ReactMarkdown>{paragraph}</ReactMarkdown>
  //               </div>
  //             )
  //         )}

  //       </div>
  //     );
  //   }
  // );

  // const UserMessage = ({
  //   message,
  //   msgIndex,
  //   onPassageUpdate,
  //   aiMessageRef,
  // }) => {
  //   const [userMsg, setUserMsg, prevUserMsg] = useVersionedState(
  //     message.content
  //   );
  //   const [rewritePopupVisible, setRewritePopupVisible] = useState(false);
  //   const [instruction, setInstruction] = useState("");

  //   const handleRewritePromptSubmit = async () => {
  //     if (loading) return;

  //     setRewritePopupVisible(false);

  //     if (aiMessageRef.current) {
  //       aiMessageRef.current.updateMsgLoading(true);
  //       aiMessageRef.current.updatedSelectedParagraphIndex(-1);
  //     }

  //     let response = await onPassageUpdate(instruction, msgIndex, userMsg);

  //     let refinedSummary = response.summary;
  //     setChatSummary(refinedSummary);
  //     // console.log(refinedSummary);

  //     let refinedUserPrompt = response.refinedUserPrompt;
  //     // console.log(refinedUserPrompt);
  //     setUserMsg(refinedUserPrompt);

  //     setMessages((prevMessages) => {
  //       const updatedMessages = [...prevMessages];
  //       updatedMessages[msgIndex - 1].content = response.updatedPassage;
  //       updatedMessages[msgIndex].content = refinedUserPrompt;
  //       return updatedMessages;
  //     });
  //     // setInstruction("");
  //   };

  // };

  const [loadingMessageIndex, setLoadingMessageIndex] = useState(null);

  const ChatComponent = ({ messages }) => {
    const aiMessageRef = useRef(null);

    const onParagraphUpdate = async (paragraph, updatePrompt, fullMessage) => {
      // Replace this with the actual server call
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/paragraph`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paragraph,
            updatePrompt: updatePrompt,
            fullMessage: fullMessage,
            previousSummary: chatSummary,
          }),
        }
      );

      const data = await response.json();
      return data;
    };

    const onPassageUpdate = async (instruction, aiMsgIndex, userPrompt) => {
      const aiPassage = messages[aiMsgIndex - 1];
      const response = await fetch(`${process.env.REACT_APP_API_URL}/passage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instruction: instruction,
          passage: aiPassage.content,
          userPrompt: userPrompt,
          previousSummary: chatSummary,
        }),
      });

      const data = await response.json();
      return data;
    };

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

    //simulate adding streaming ai messages
    useEffect(() => {
      const interval = setInterval(() => {
        if (messages.length == 0) {
          //add initial message
        }
        if (
          messages.length > 0 &&
          messages[0].content.split("\n\n").length < 14
        ) {
          //add more paragraphs
          setLoadingMessageIndex(0);
          let exampleParagraph = `Elena hesitated at the threshold, her fingers trembling as they traced the outline of the faded brass doorknob. The wooden door creaked open with a groan, echoing through the silent corridors like a long-forgotten sigh. Dust motes danced in the pale light filtering through the cracked windows, casting a hazy veil over the once-vibrant home. Her breath caught in her throat as she stepped inside, the floorboards beneath her`;

          let paragraphText = `Added paragraph ${
            messages[0].content.split("\n\n").length
          } - ${exampleParagraph}`;
          const aiMessage = {
            role: "ai",
            content: messages[0].content + "\n\n" + paragraphText,
          };
          //set message at index 0
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            newMessages[0] = aiMessage;
            return newMessages;
          });
        } else {
          clearInterval(interval);
        }
        setLoadingMessageIndex(null);
      }, 1000);

      return () => clearInterval(interval);
    }, [messages]);

    return (
      <div>
        {messages.map((msg, index) =>
          msg.role === "ai" ? (
            <MessageComponent
              key={index}
              paragraphs={msg.content.split("\n\n")}
              isLoading={loadingMessageIndex === index}
            />
          ) : (
            // <AIMessage
            //   key={index}
            //   message={msg}
            //   msgIndex={index}
            //   onParagraphUpdate={onParagraphUpdate}
            //   ref={aiMessageRef}
            // />
            <UserMessage
              key={index}
              message={msg}
              msgIndex={index}
              onPassageUpdate={onPassageUpdate}
              aiMessageRef={aiMessageRef}
            />
          )
        )}
      </div>
    );
  };

  const SideBar = ({ chatHistory, onNewChat, onLoadChat }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => {
      setIsSidebarOpen((prev) => !prev);
    };

    const handleNewChat = () => {
      onNewChat();
    };

    const loadChatFromHistory = (chat) => {
      onLoadChat(chat);
    };

    const handleSaveHistory = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/history/save`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(chatHistory),
          }
        );

        if (response.ok) {
          console.log("Chat history saved!");
        } else {
          console.error("Failed to save chat history:", response.statusText);
        }
      } catch (error) {
        console.error("Error saving chat history:", error);
      }
    };

    const handleLoadHistory = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/history/load`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setChatHistory(data);
          console.log("Chat history loaded!");
        } else {
          console.error("Failed to load chat history:", response.statusText);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };

    return (
      <div>
        {/* Sidebar Toggle Button */}
        <button
          className="fixed top-6 left-0 transform -translate-y-1/2 translate-x-2 p-3 bg-blue-500 text-white rounded-full z-50 shadow-lg"
          onClick={toggleSidebar}
        >
          <FiMenu size={16} />
        </button>

        {/* Sidebar */}
        <div
          className={`fixed top-18 left-0 h-full bg-gray-200 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out w-full sm:w-1/4 sm:max-w-[300px] z-40`}
        >
          {/* Top Menu */}
          <div className="p-4 bg-gray-300 flex justify-between items-center">
            <h2 className="text-lg font-bold">Chat History</h2>
            <button
              className="p-2 bg-blue-500 text-white rounded-lg"
              onClick={onNewChat}
            >
              New Chat
            </button>
            {/* <SummaryComponent /> */}
          </div>

          {/* Chat History */}
          <div className="flex-grow overflow-y-auto p-4">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className="p-2 mb-2 bg-white rounded-lg shadow cursor-pointer"
                onClick={() => loadChatFromHistory(chat)}
              >
                <p>Chat on {new Date(chat.id).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Save and Load Buttons */}
          <div className="p-4 bg-gray-300 flex justify-between items-center">
            <button
              className="p-2 bg-green-500 text-white rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveHistory();
              }}
            >
              Save History
            </button>
            <button
              className="p-2 bg-blue-500 text-white rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadHistory();
              }}
            >
              Load History
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ChatInputBar = ({ onSendInput }) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [input, setInput] = useState("");

    const CollapsibleSection = ({ section }) => {
      const [isOpen, setIsOpen] = useState(false);
      const [isEditing, setIsEditing] = useState(false);
      const [editablePoints, setEditablePoints] = useState(section.points);

      const toggleSection = () => {
        if (isOpen && isEditing) {
          // Reset to original points if the section is collapsed without updating
          setEditablePoints(section.points);
          setIsEditing(false);
        }
        setIsOpen((prev) => !prev);
      };

      const handleEdit = () => {
        setIsEditing(true);
      };

      const handleUpdate = () => {
        setIsEditing(false);
      };

      const handleChange = (index, value) => {
        const updatedPoints = [...editablePoints];
        updatedPoints[index] = value;
        setEditablePoints(updatedPoints);
      };

      return (
        <div className="border-b border-gray-300">
          <button
            className="w-full p-4 text-left focus:outline-none bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg hover:bg-blue-600 transition duration-300 ease-in-out"
            onClick={toggleSection}
          >
            {section.title}
          </button>
          {isOpen && (
            <div className="p-4 bg-gray-50 rounded-b-lg">
              <ul className="list-disc pl-5 text-gray-700">
                {editablePoints.map((point, index) => (
                  <li key={index} className="mb-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editablePoints[index]}
                        onChange={(e) => handleChange(index, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg shadow-inner"
                      />
                    ) : (
                      <span>{point}</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex justify-end mt-4">
                {isEditing ? (
                  <button
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-300 ease-in-out shadow-md"
                    onClick={handleUpdate}
                  >
                    Update
                  </button>
                ) : (
                  <button
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300 ease-in-out shadow-md"
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      );
    };

    const ParamsPanel = ({ params }) => {
      return (
        <div className="accordion w-full max-h-[400px] overflow-auto rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          {params.map((section, index) => (
            <CollapsibleSection key={index} section={section} />
          ))}
        </div>
      );
    };
    const togglePanel = () => {
      setIsPanelOpen((prev) => !prev);
    };

    const handleKeyPress = (e) => {
      if (e.key === "Enter") {
        onSendInput(input);
      }
    };
    return (
      <div className="px-2 py-2">
        <div className="flex flex-col sm:flex-row sm:items-center mx-2 sm:mx-10 gap-2">
          <textarea
            className="flex-grow p-3 border border-gray-300 rounded-xl bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={3} // Adjust the number of rows as needed
          />
          <div className="flex flex-row sm:flex-row items-center justify-between gap-4">
            <button
              className="p-3 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-xl shadow-md hover:shadow-lg transition duration-300 ease-in-out"
              onClick={togglePanel}
            >
              Open Panel
            </button>
            <button
              className="p-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition duration-300 ease-in-out"
              onClick={() => onSendInput(input)}
            >
              <FaPaperPlane size={20} />
            </button>
          </div>
        </div>

        {/* Popup Panel */}
        {isPanelOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white w-full sm:w-3/4 max-w-lg p-6 rounded-2xl shadow-xl">
              <button
                className="mb-4 p-3 bg-red-500 text-white rounded-xl shadow-md hover:shadow-lg transition duration-300 ease-in-out"
                onClick={togglePanel}
              >
                Close Panel
              </button>
              <ParamsPanel params={parameters} />
            </div>
          </div>
        )}
      </div>
    );
  };

  const SummaryPanel = () => {
    // const SummaryPanel = () => {
    //   return (

    //   );
    // };
    return (
      <div className="p-4">
        <div className="accordion w-full max-h-[200px] overflow-auto rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <VersionedText
            text={{ current: chatSummary, previous: previousChatSummary }}
          />
        </div>
      </div>
    );
  };

  const [currentChatId, setCurrentChatId] = useState(Date.now());

  const onNewChat = () => {
    if (messages.length > 0 && messages.some((msg) => msg.role === "ai")) {
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { id: Date.now(), messages: [...messages], summary: chatSummary },
      ]);
    }
    setMessages([]);
    setChatSummary("Test Summary");
    setCurrentChatId(Date.now());
  };

  const onLoadChat = (chat) => {
    setMessages(chat.messages);
    setChatSummary(chat.summary);
    setCurrentChatId(chat.id);
  };

  const ChatLayout = ({ handleSend }) => {
    const [isChatInputVisible, setIsChatInputVisible] = useState(true);
    const [isChatSummaryVisible, setIsChatSummaryVisible] = useState(false);

    const toggleChatInput = () => {
      setIsChatInputVisible(!isChatInputVisible);
    };

    const toggleChatSummary = () => {
      setIsChatSummaryVisible((prev) => !prev);
    };

    const saveChat = () => {
      if (messages.length > 0 && messages.some((msg) => msg.role === "ai")) {
        setChatHistory((prevHistory) => {
          const existingChatIndex = prevHistory.findIndex(
            (chat) => chat.id === currentChatId
          );

          if (existingChatIndex !== -1) {
            // Replace the existing chat history entry
            const updatedHistory = [...prevHistory];
            updatedHistory[existingChatIndex] = {
              id: currentChatId,
              messages: [...messages],
              summary: chatSummary,
            };
            return updatedHistory;
          } else {
            // Add a new chat history entry
            return [
              ...prevHistory,
              {
                id: currentChatId,
                messages: [...messages],
                summary: chatSummary,
              },
            ];
          }
        });
      }
    };

    return (
      <div>
        {/* <div
          className={`flex-grow flex flex-col overflow-y-auto p-4 border border-red-300 shadow-lg rounded-lg transition-all duration-300 ${
            isChatInputVisible
              ? "max-h-[calc(100vh-19rem)]"
              : "max-h-[calc(100vh-9rem)]"
          }`}
        >
          {messages.length > 0 ? (
            <ChatComponent messages={messages} />
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">
              No messages yet.
            </div>
          )}
        </div> */}

        {isChatInputVisible && (
          <div className="p-2 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 border border-gray-300 shadow-xl rounded-2xl ">
            <ChatInputBar onSendInput={handleSend} />
          </div>
        )}
        {isChatSummaryVisible && <SummaryPanel />}

        <button
          className={`fixed top-16 right-4 p-3 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-in-out ${
            isChatInputVisible
              ? "bg-gray-700 text-white"
              : "bg-white text-gray-700 border border-gray-300"
          }`}
          onClick={toggleChatInput}
        >
          <FaKeyboard size={20} />
        </button>

        <button
          className={`fixed top-28 right-4 p-3 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-in-out ${
            isChatSummaryVisible
              ? "bg-gray-700 text-white"
              : "bg-white text-gray-700 border border-gray-300"
          }`}
          onClick={toggleChatSummary}
        >
          <FaRegFileAlt size={20} />
        </button>

        <button
          className={`fixed top-40 right-4 p-3 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-in-out bg-white text-gray-700 border border-gray-300`}
          onClick={saveChat}
        >
          <FaSave size={20} />
        </button>
      </div>
    );
  };

  const onParagraphUpdate = async (msgIndex, paraIndex, instruction) => {
    let fullMessage = messages[msgIndex].content;
    let paragraph = messages[msgIndex].content.split("\n\n")[paraIndex];
    // Replace this with the actual server call
    const response = await fetch(`${process.env.REACT_APP_API_URL}/paragraph`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paragraph,
        systemPrompt: systemPrompts[0] + "\n" + systemPrompts[1],
        instruction: instruction,
        fullMessage: fullMessage,
        previousSummary: chatSummary,
      }),
    });

    const data = await response.json();
    const newParagraphs = fullMessage.split("\n\n");
    newParagraphs[paraIndex] = data.updatedParagraph;

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      updatedMessages[msgIndex].content = newParagraphs.join("\n\n");
      return updatedMessages;
    });
    return data;
  };

  return (
    <div className="flex flex-grow bg-gray-100 h-full">
      <SideBar
        chatHistory={chatHistory}
        onNewChat={onNewChat}
        onLoadChat={onLoadChat}
      />

      <div className="h-[calc(100vh-8rem)] w-screen flex flex-col bg-gray-100 mt-2">
        <div
          className={`flex-grow flex flex-col overflow-y-auto p-4 border border-red-300 shadow-lg rounded-lg transition-all duration-300 max-h-[calc(100vh-19rem)]`}
        >
          {messages.map((msg, index) =>
            msg.role === "ai" ? (
              <AssistantChat
                key={index}
                msgIndex={index}
                paragraphs={msg.content.split("\n\n")}
                streaming={msg.streaming}
                onParagraphUpdate={onParagraphUpdate}
              />
            ) : (
              <UserChat key={index} paragraphs={msg.content.split("\n\n")} />
            )
          )}
        </div>
        <ChatLayout handleSend={handleSend} />
      </div>
    </div>
  );
}

export default HomePage;
