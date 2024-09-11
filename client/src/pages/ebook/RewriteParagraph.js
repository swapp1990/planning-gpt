import React, { useReducer, useEffect, useState, useRef } from "react";
import { FaCheck, FaTimes, FaCheckDouble, FaTimesCircle } from "react-icons/fa";
import { streamedApiCallBasic } from "../../utils/api";
import { splitSentences } from "../../utils/paragraphDiff";
import { useEbook } from "../../context/EbookContext";

const rewriteSentence = async (
  sentence,
  instruction,
  paragraph,
  parameters,
  chapter_synopsis
) => {
  try {
    let revised_sentence = null;
    const onChunk = (data) => {
      let response = JSON.parse(data);
      if (response.status == "rewriting") {
      } else if (response.status == "complete") {
        revised_sentence = response.revised_sentence;
      } else if (response.status == "ok") {
        revised_sentence = null;
      }
    };

    const onError = (error) => {
      console.error("Error fetching revised sentence:", error);
      return null;
    };
    await streamedApiCallBasic(
      `${process.env.REACT_APP_API_URL}/sentence/rewrite`,
      "POST",
      {
        sentence: sentence,
        instruction: instruction,
        paragraph: paragraph,
        parameters: parameters,
        chapter_synopsis: chapter_synopsis,
      },
      onChunk,
      onError
    );
    return { sentence: revised_sentence };
  } catch (error) {
    return null;
  }
};

const rewritingReducer = (state, action) => {
  switch (action.type) {
    case "START_REWRITING":
      return { ...state, isRewriting: true, currentSentence: -1 };
    case "SET_SENTENCE_STATUS":
      return {
        ...state,
        sentenceStatuses: {
          ...state.sentenceStatuses,
          [action.payload.key]: action.payload.status,
        },
      };
    case "SET_SCANNING_COMPLETE":
      return { ...state, isScanningComplete: true };
    case "ACCEPT_ALL":
      return {
        ...state,
        sentenceStatuses: Object.keys(state.sentenceStatuses).reduce(
          (acc, key) => {
            acc[key] = state.rewrittenSentences[key]
              ? "accepted"
              : state.sentenceStatuses[key];
            return acc;
          },
          {}
        ),
        acceptedRewrites: {
          ...state.acceptedRewrites,
          ...Object.keys(state.rewrittenSentences).reduce((acc, key) => {
            if (state.rewrittenSentences[key]) {
              acc[key] = state.rewrittenSentences[key];
            }
            return acc;
          }, {}),
        },
        rewrittenSentences: {},
      };
    case "REJECT_ALL":
      return {
        ...state,
        sentenceStatuses: Object.keys(state.sentenceStatuses).reduce(
          (acc, key) => {
            acc[key] = state.rewrittenSentences[key]
              ? "ok"
              : state.sentenceStatuses[key];
            return acc;
          },
          {}
        ),
        rewrittenSentences: {},
      };
    case "SET_REWRITTEN_SENTENCE":
      return {
        ...state,
        sentenceStatuses: {
          ...state.sentenceStatuses,
          [action.payload.key]: "rewrite",
        },
        rewrittenSentences: {
          ...state.rewrittenSentences,
          [action.payload.key]: action.payload.sentence,
        },
      };
    case "NEXT_SENTENCE":
      return { ...state, currentSentence: state.currentSentence + 1 };
    case "FINISH_REWRITING":
      return { ...state, isRewriting: false };
    case "ACCEPT_REWRITE":
      return {
        ...state,
        sentenceStatuses: {
          ...state.sentenceStatuses,
          [action.payload.key]: "accepted",
        },
        rewrittenSentences: {
          ...state.rewrittenSentences,
          [action.payload.key]: null,
        },
        acceptedRewrites: {
          ...state.acceptedRewrites,
          [action.payload.key]: action.payload.newSentence,
        },
      };
    case "REJECT_REWRITE":
      return {
        ...state,
        sentenceStatuses: {
          ...state.sentenceStatuses,
          [action.payload.key]: "ok",
        },
        rewrittenSentences: {
          ...state.rewrittenSentences,
          [action.payload.key]: null,
        },
      };
    case "RESET":
      return {
        isRewriting: false,
        currentSentence: -1,
        sentenceStatuses: {},
        rewrittenSentences: {},
        acceptedRewrites: {},
        isScanningComplete: false,
      };
    default:
      return state;
  }
};

const Sentence = ({
  sentence,
  status,
  newSentence,
  onAccept,
  onReject,
  sentenceKey,
}) => {
  let className = "transition-all duration-300 relative mt-2 ";
  if (status === "scanning") className += "bg-yellow-200 ";
  else if (status === "rewriting") className += "bg-red-200 ";
  else if (status === "accepted") className += "bg-green-200 ";

  return (
    <span className={className}>
      {status === "rewrite" && (
        <span className="text-blue-600 text-sm mb-1 new-sentence flex items-start">
          <span className="mr-1">{newSentence}</span>
          <span className="inline-flex items-center flex-shrink-0">
            <button
              onClick={() => onAccept(sentenceKey, newSentence)}
              className="bg-gray-200 text-green-500 hover:text-green-700 transition-colors duration-200 mr-1 p-1 rounded"
              aria-label="Accept rewrite"
            >
              <FaCheck size={14} />
            </button>
            <button
              onClick={() => onReject(sentenceKey)}
              className="bg-gray-200 text-red-500 hover:text-red-700 transition-colors duration-200 p-1 rounded"
              aria-label="Reject rewrite"
            >
              <FaTimes size={14} />
            </button>
          </span>
        </span>
      )}
      <span className={status === "rewrite" ? "text-gray-500" : ""}>
        {sentence}&nbsp;
      </span>
    </span>
  );
};

const RewriteParagraph = ({
  content,
  index,
  instruction,
  onRewriteComplete,
  isRewriting,
  onUpdateParagraph,
  isCancelled,
}) => {
  const { ebookState } = useEbook();
  const cancelledRef = useRef(false);
  const [state, dispatch] = useReducer(rewritingReducer, {
    isRewriting: false,
    currentSentence: -1,
    sentenceStatuses: {},
    rewrittenSentences: {},
    acceptedRewrites: {},
    isScanningComplete: false,
  });

  const [paragraphContent, setParagraphContent] = useState(content);
  const [sentences, setSentences] = useState([]);
  const chapter = ebookState.chapters.find(
    (c) => c.id === ebookState.currentChapter
  );

  useEffect(() => {
    if (isCancelled) {
      dispatch({ type: "RESET" });
      setParagraphContent(content);
    }
  }, [isCancelled, content]);

  useEffect(() => {
    cancelledRef.current = false;
    const processRewrite = async () => {
      if (!isRewriting) return;
      if (state.isScanningComplete) return;
      dispatch({ type: "START_REWRITING" });

      const sentences = splitSentences(paragraphContent);
      // console.log(sentences);
      setSentences(sentences);
      for (let i = 0; i < sentences.length; i++) {
        if (isCancelled) {
          dispatch({ type: "RESET" });
          break;
        }
        if (sentences[i].trim() !== "") {
          dispatch({
            type: "SET_SENTENCE_STATUS",
            payload: { key: `${index}-${i}`, status: "scanning" },
          });
          const rewrittenSentence = (
            await rewriteSentence(
              sentences[i],
              instruction,
              paragraphContent,
              ebookState.parameters,
              chapter.synopsis
            )
          ).sentence;
          if (cancelledRef.current) {
            break;
          }
          if (rewrittenSentence != null && !isCancelled) {
            dispatch({
              type: "SET_REWRITTEN_SENTENCE",
              payload: { key: `${index}-${i}`, sentence: rewrittenSentence },
            });
          } else {
            dispatch({
              type: "SET_SENTENCE_STATUS",
              payload: { key: `${index}-${i}`, status: "ok" },
            });
          }
        }
        if (cancelledRef.current) break;
        dispatch({ type: "NEXT_SENTENCE" });
      }
      if (!isCancelled) {
        dispatch({ type: "FINISH_REWRITING" });
        dispatch({ type: "SET_SCANNING_COMPLETE" });
        onRewriteComplete(index);
      }
    };

    processRewrite();
    return () => {
      cancelledRef.current = true;
    };
  }, [isRewriting, paragraphContent, index, instruction, onRewriteComplete]);

  useEffect(() => {
    cancelledRef.current = isCancelled;
  }, [isCancelled]);

  const handleAccept = (key, newSentence) => {
    dispatch({ type: "ACCEPT_REWRITE", payload: { key, newSentence } });
    updateParagraphContent(key, newSentence);
  };

  const handleReject = (key) => {
    dispatch({ type: "REJECT_REWRITE", payload: { key } });
  };

  const handleAcceptAll = () => {
    dispatch({ type: "ACCEPT_ALL" });
    Object.entries(state.rewrittenSentences).forEach(([key, sentence]) => {
      updateParagraphContent(key, sentence);
    });
  };

  const handleRejectAll = () => {
    dispatch({ type: "REJECT_ALL" });
  };

  const handleCancelRewrite = () => {
    console.log("handleCancelRewrite");
    cancelledRef.current = true;
  };

  const handleSubmitRewrite = () => {
    console.log("handleSubmitRewrite");
    onUpdateParagraph(index, paragraphContent);
  };

  const updateParagraphContent = (key, newSentence) => {
    const [, sentenceIndex] = key.split("-").map(Number);
    if (sentences[sentenceIndex]) {
      sentences[sentenceIndex] = newSentence;
      const updatedContent = sentences.join(" ");
      setParagraphContent(updatedContent);
    }
  };

  return (
    <div className="p-3 bg-gray-100 rounded-lg">
      {sentences &&
        sentences.map((sentence, sentenceIndex) => {
          if (!sentence || sentence.trim() === "") return null;
          const key = `${index}-${sentenceIndex}`;
          const status = state.sentenceStatuses[key];
          const newSentence = state.rewrittenSentences[key];

          return (
            <Sentence
              key={key}
              sentence={sentence}
              status={status}
              newSentence={newSentence}
              onAccept={handleAccept}
              onReject={handleReject}
              sentenceKey={key}
            />
          );
        })}
      {state.isScanningComplete &&
        !isCancelled &&
        Object.keys(state.rewrittenSentences).length > 0 && (
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={handleAcceptAll}
              className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center"
            >
              <FaCheckDouble className="mr-1" /> Accept All
            </button>
            <button
              onClick={handleRejectAll}
              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors duration-200 flex items-center"
            >
              <FaTimesCircle className="mr-1" /> Reject All
            </button>
          </div>
        )}

      <div>
        {!state.isScanningComplete && (
          <button
            onClick={handleCancelRewrite}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
          >
            Cancel Rewrite
          </button>
        )}
        {state.isScanningComplete && (
          <button
            onClick={handleSubmitRewrite}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
          >
            Submit Rewrite
          </button>
        )}
      </div>
    </div>
  );
};

export default RewriteParagraph;
