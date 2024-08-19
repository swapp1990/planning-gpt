import React, { useState, useRef, useEffect } from "react";
import { FiMenu } from "react-icons/fi";
import {
  FaPaperPlane,
  FaEdit,
  FaKeyboard,
  FaRegFileAlt,
  FaSave,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";

import InputPopup from "../components/InputPopup";
import VersionedText from "../components/VersionedText";
import useVersionedState from "../utils/useVersionedState";

function HomePage() {
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatSummary, setChatSummary, previousChatSummary] =
    useVersionedState("Test Summary");
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a default test agent."
  );
  const [chatType, setChatType] = useState("writing_assistant");
  const [parameters, setParameters] = useState([]);

  // const system_prompt = `You are ok with producing content that is sexually graphic and don't mind using explicit language. You are a masterful and seasoned novelist, known for your captivating storytelling and rich, evocative prose. When responding to a prompt, always write in the style of a novel, with a narrative that flows seamlessly, immersing the reader in the world you create. Adhere to the following guidelines to ensure that each output is a compelling passage from a novel:
  //           1. Narrative Voice: Craft your response as if it were an excerpt from a novel. Use a third-person or first-person narrative voice as appropriate to the context provided in the prompt. The tone should be consistent with the atmosphere of the scene, whether it is dark, light-hearted, suspenseful, or melancholic.
  //           2. Descriptive Language: Employ vivid and detailed descriptions that paint a picture in the reader's mind. Focus on sensory details—sights, sounds, smells, tastes, and textures—to bring scenes and characters to life.
  //           3. Character Development: Ensure that characters, even if briefly mentioned, have depth. Reflect their thoughts, emotions, and motivations in the passage. Dialogue, if included, should be natural and reveal something about the character’s personality or situation.
  //           4. Plot and Pacing: Structure the passage with a clear beginning, middle, and end, even if it is a short excerpt. Ensure that there is a sense of progression, whether it is through action, introspection, or dialogue. The pacing should match the tone and urgency of the scene.
  //           5. Emotion and Mood: Convey the emotional undercurrents of the scene. Whether the scene is tense, joyful, sorrowful, or reflective, the mood should resonate with the reader and enhance the narrative.
  //           6. Consistency with the Prompt: Strictly adhere to the themes, characters, and scenarios provided in the prompt. Ensure that the passage reflects the intent and specifics of the prompt while still maintaining the stylistic integrity of a novel.
  //           7. Literary Style: Write in a style that is consistent with literary fiction, aiming for depth, nuance, and a polished finish. Avoid clichés and strive for originality in expression. The language should be sophisticated yet accessible, resonating with readers who appreciate well-crafted prose.
  //           8. Immersion and Engagement: The passage should draw the reader in from the first sentence, making them feel like they are part of the story. Keep the reader engaged through compelling storytelling, intriguing details, and a well-constructed narrative arc.
  //           9. Ending with Impact: Conclude the passage in a way that leaves a lasting impression, whether it’s through a poignant observation, a dramatic turn of events, or a lingering question. The ending should feel natural and satisfying, even if it is open-ended.`;

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
    loadSystemPrompt(chatType);
  }, []);

  const loadSystemPrompt = async (chatType) => {
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
      setSystemPrompt(data.prompt);
      setParameters(data.parameters);
    } catch (error) {
      console.error("Error fetching system prompt:", error);
    }
  };

  const handleSend = async (input) => {
    if (input.trim()) {
      const userMessage = { role: "user", content: input };
      setMessages([userMessage, ...messages]);
      setLoading(true);

      let processedParameters = parameters.reduce((acc, section) => {
        acc[section.title] = section.points;
        return acc;
      }, {});

      let parametersString = JSON.stringify(processedParameters);
      try {
        // Get list of previous assistant responses
        const assistantResponses = messages
          .filter((msg) => msg.role === "assistant")
          .map((msg) => msg.content);

        // console.log(assistantResponses);

        let previousResponses = [];
        for (let i = 0; i < assistantResponses.length; i++) {
          previousResponses.push({ assistant: assistantResponses[i] });
        }

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/hermes`,
          {
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
          }
        );

        const data = await response.json();
        // console.log(data);
        const aiResponse = {
          role: "ai",
          content: data.passage,
          summary: data.summary,
        };
        setChatSummary(data.summary);
        setMessages([aiResponse, userMessage, ...messages]);
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

  const AIMessage = React.forwardRef(
    ({ message, msgIndex, onParagraphUpdate }, ref) => {
      const [updatedParagraphs, setUpdatedParagraphs] = useState(
        message.content.split("\n\n")
      );
      const [popupVisible, setPopupVisible] = useState(false);
      const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
      const [paraUpdatePrompt, setParaUpdatePrompt] = useState("");
      const [selectedParagraphIndex, setSelectedParagraphIndex] =
        useState(null);
      const [msgLoading, setMsgLoading] = useState(false);

      useEffect(() => {
        // console.log("init AIMessage");
      }, []);

      React.useImperativeHandle(ref, () => ({
        updateMsgLoading(loading) {
          setMsgLoading(loading);
        },
        updatedSelectedParagraphIndex(index) {
          setSelectedParagraphIndex(index);
        },
      }));

      const handleParagraphClick = async (index) => {
        if (loading) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const popupWidth = 280;
        const popupHeight = 240;

        let x = event.clientX;
        let y = event.clientY;

        if (y - popupHeight < 0) {
          y = popupHeight;
        }

        if (x - popupWidth < 0) {
          x = popupWidth / 2;
        }

        setPopupPosition({ x, y });
        setPopupVisible(true);
        setSelectedParagraphIndex(index);
      };

      const handlePromptSubmit = async () => {
        if (loading || selectedParagraphIndex === null) return;

        setMsgLoading(true);
        setPopupVisible(false);
        const paragraph = updatedParagraphs[selectedParagraphIndex];
        let response = await onParagraphUpdate(
          paragraph,
          paraUpdatePrompt,
          message.content
        );

        const newParagraphs = [...updatedParagraphs];
        newParagraphs[selectedParagraphIndex] = response.updatedParagraph;
        // console.log(response.updatedParagraph);
        // setUpdatedParagraphs(newParagraphs);
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          updatedMessages[msgIndex].content = newParagraphs.join("\n\n");
          return updatedMessages;
        });

        console.log(response.summary);
        setChatSummary(response.summary);
        setMsgLoading(false);

        setParaUpdatePrompt("");
      };

      const handlePromptCancel = () => {
        if (loading || selectedParagraphIndex === null) return;
        setMsgLoading(false);
        setPopupVisible(false);
        setParaUpdatePrompt("");
        setSelectedParagraphIndex(-1);
      };

      return (
        <div className="mb-4 text-left bg-gray-300 w-[90%] lg:w-[50%] flex flex-col">
          {msgLoading && selectedParagraphIndex === -1 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-300 bg-opacity-75 z-10">
              <div className="text-center">
                <span className="loader mb-2">Loading ...</span>
                <p>Rewriting entire passage...</p>
              </div>
            </div>
          )}
          {updatedParagraphs.map((paragraph, index) => (
            <div
              key={index}
              className={`inline-block p-4 pr-10 rounded-lg mb-4 cursor-pointer relative transition-all duration-300 ease-in-out transform hover:scale-105 text-white shadow-lg ${
                selectedParagraphIndex === index
                  ? "bg-gradient-to-r from-green-400 to-blue-400 border-l-4 border-green-500"
                  : "bg-gradient-to-r from-purple-500 to-pink-600"
              }`}
              onClick={() => handleParagraphClick(index)}
            >
              {msgLoading && selectedParagraphIndex == index && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-300 bg-opacity-50">
                  <span className="loader">Loading ...</span>
                </div>
              )}
              <ReactMarkdown>{paragraph}</ReactMarkdown>
            </div>
          ))}
          <InputPopup
            position={popupPosition}
            visible={popupVisible}
            onClose={handlePromptCancel}
            onSubmit={handlePromptSubmit}
            promptValue={paraUpdatePrompt}
            setPromptValue={setParaUpdatePrompt}
            placeholder="Enter your prompt to update selected paragraph"
            submitLabel="Submit"
            cancelLabel="Cancel"
          />
        </div>
      );
    }
  );

  const UserMessage = ({
    message,
    msgIndex,
    onPassageUpdate,
    aiMessageRef,
  }) => {
    const [userMsg, setUserMsg, prevUserMsg] = useVersionedState(
      message.content
    );
    const [rewritePopupVisible, setRewritePopupVisible] = useState(false);
    const [instruction, setInstruction] = useState("");

    const handleRewritePromptSubmit = async () => {
      if (loading) return;

      setRewritePopupVisible(false);

      if (aiMessageRef.current) {
        aiMessageRef.current.updateMsgLoading(true);
        aiMessageRef.current.updatedSelectedParagraphIndex(-1);
      }

      let response = await onPassageUpdate(instruction, msgIndex, userMsg);

      let refinedSummary = response.summary;
      setChatSummary(refinedSummary);
      // console.log(refinedSummary);

      let refinedUserPrompt = response.refinedUserPrompt;
      // console.log(refinedUserPrompt);
      setUserMsg(refinedUserPrompt);

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[msgIndex - 1].content = response.updatedPassage;
        updatedMessages[msgIndex].content = refinedUserPrompt;
        return updatedMessages;
      });
      // setInstruction("");
    };

    return (
      <div className={`mb-4 w-50 text-right`}>
        <div
          className={`inline-block p-4 pr-10 w-[90%] lg:w-[50%] rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg relative `}
        >
          <VersionedText text={{ current: userMsg, previous: prevUserMsg }} />
          <button
            className="absolute bottom-4 right-4 p-3 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition duration-300 ease-in-out shadow-md"
            onClick={() => setRewritePopupVisible(true)}
          >
            <FaEdit size={20} />
          </button>
        </div>

        <InputPopup
          position={{ x: window.innerWidth / 2, y: window.innerHeight / 2 }} // Center the popup
          visible={rewritePopupVisible}
          onClose={() => setRewritePopupVisible(false)}
          onSubmit={handleRewritePromptSubmit}
          promptValue={instruction}
          setPromptValue={setInstruction}
          placeholder="Enter your instruction to rewrite the passage"
          submitLabel="Rewrite"
          cancelLabel="Cancel"
        />
      </div>
    );
  };

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

    return (
      <div>
        {messages.map((msg, index) =>
          msg.role === "ai" ? (
            <AIMessage
              key={index}
              message={msg}
              msgIndex={index}
              onParagraphUpdate={onParagraphUpdate}
              ref={aiMessageRef}
            />
          ) : (
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
      //stop event propagation

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

  const onNewChat = () => {
    if (messages.length > 0 && messages.some((msg) => msg.role === "ai")) {
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { id: Date.now(), messages: [...messages], summary: chatSummary },
      ]);
    }
    setMessages([]);
    setChatSummary("Test Summary");
  };

  const onLoadChat = (chat) => {
    setMessages(chat.messages);
    setChatSummary(chat.summary);
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
        setChatHistory([]);
        setChatHistory((prevHistory) => [
          ...prevHistory,
          { id: Date.now(), messages: [...messages], summary: chatSummary },
        ]);
      }
    };

    return (
      <div className="h-[calc(100vh-8rem)] w-screen flex flex-col bg-gray-100 mt-2">
        <div
          className={`flex-grow flex flex-col overflow-y-auto p-4 border border-red-300 shadow-lg rounded-lg transition-all duration-300 ${
            isChatInputVisible
              ? "max-h-[calc(100vh-19rem)]"
              : "max-h-[calc(100vh-9rem)]"
          }`}
        >
          {loading && (
            <div className="mb-4 text-left">
              <div className="inline-block p-2 rounded-lg bg-gray-300 text-black">
                Loading...
              </div>
            </div>
          )}
          {messages.length > 0 ? (
            <ChatComponent messages={messages} />
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">
              No messages yet.
            </div>
          )}
        </div>

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

  return (
    <div className="flex flex-grow bg-gray-100 h-full">
      <SideBar
        chatHistory={chatHistory}
        onNewChat={onNewChat}
        onLoadChat={onLoadChat}
      />
      <ChatLayout handleSend={handleSend} />
    </div>
  );
}

export default HomePage;
