import React, { useReducer, useEffect, useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { streamedApiCallBasic } from "../../utils/api";

const rewriteSentence = async (sentence, instruction) => {
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
  let className = "transition-all duration-300 relative ";
  if (status === "scanning") className += "bg-yellow-200 ";
  else if (status === "rewriting") className += "bg-red-200 ";
  else if (status === "accepted") className += "bg-green-200 ";

  return (
    <span className={className}>
      {status === "rewrite" && (
        <span className="text-blue-600 text-sm mb-1 new-sentence flex items-start">
          <span className="mr-1">{newSentence}.</span>
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
        {sentence}.
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
}) => {
  const [state, dispatch] = useReducer(rewritingReducer, {
    isRewriting: false,
    currentSentence: -1,
    sentenceStatuses: {},
    rewrittenSentences: {},
    acceptedRewrites: {},
  });

  const [paragraphContent, setParagraphContent] = useState(content);

  useEffect(() => {
    const processRewrite = async () => {
      if (!isRewriting) return;

      dispatch({ type: "START_REWRITING" });
      const sentences = paragraphContent.match(/[^.!?]+[.!?]+|\s*$/g) || [];
      for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].trim() !== "") {
          dispatch({
            type: "SET_SENTENCE_STATUS",
            payload: { key: `${index}-${i}`, status: "scanning" },
          });
          const rewrittenSentence = (
            await rewriteSentence(sentences[i], instruction)
          ).sentence;
          if (rewrittenSentence != null) {
            dispatch({
              type: "SET_REWRITTEN_SENTENCE",
              payload: { key: `${index}-${i}`, sentence: rewrittenSentence },
            });
            // dispatch({
            //   type: "SET_SENTENCE_STATUS",
            //   payload: { key: `${index}-${i}`, status: "rewriting" },
            // });
          } else {
            dispatch({
              type: "SET_SENTENCE_STATUS",
              payload: { key: `${index}-${i}`, status: "ok" },
            });
          }
        }
        dispatch({ type: "NEXT_SENTENCE" });
      }
      dispatch({ type: "FINISH_REWRITING" });
      onRewriteComplete(index);
    };

    processRewrite();
  }, [isRewriting, paragraphContent, index, instruction, onRewriteComplete]);

  const handleAccept = (key, newSentence) => {
    dispatch({ type: "ACCEPT_REWRITE", payload: { key, newSentence } });
    const [, sentenceIndex] = key.split("-").map(Number);

    // Split content into sentences more accurately
    const sentences = paragraphContent.match(/[^.!?]+[.!?]+|\s*$/g) || [];

    // Replace only the rewritten sentence, preserving original spacing
    if (sentences[sentenceIndex]) {
      const originalSpaceBefore = sentences[sentenceIndex].match(/^\s*/)[0];
      const originalSpaceAfter = sentences[sentenceIndex].match(/\s*$/)[0];
      sentences[sentenceIndex] =
        originalSpaceBefore + newSentence.trim() + originalSpaceAfter;

      // Join sentences back together
      const updatedContent = sentences.join("");

      setParagraphContent(updatedContent);
      onUpdateParagraph(index, updatedContent);
    }
  };

  const handleReject = (key) => {
    dispatch({ type: "REJECT_REWRITE", payload: { key } });
  };

  return (
    <div className="mb-4 p-3 bg-gray-100 rounded-lg">
      {(paragraphContent.match(/[^.!?]+[.!?]+|\s*$/g) || []).map(
        (sentence, sentenceIndex) => {
          if (sentence.trim() === "") return null;
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
        }
      )}
    </div>
  );
};

export default RewriteParagraph;
