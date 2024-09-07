import React, {
  useReducer,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { FaSync, FaGithub, FaTwitter, FaCheck, FaTimes } from "react-icons/fa";
import { streamedApiCallBasic } from "../../utils/api";

const INITIAL_PARAGRAPHS = [
  "John was a skilled carpenter, known for his intricate woodwork. He spent his days in his workshop, crafting beautiful furniture and ornate decorations. His passion for woodworking was evident in every piece he created.",
  "As a carpenter, John's hands were rough and calloused from years of working with tools. He took great pride in his ability to transform raw lumber into works of art. His workshop was always filled with the sweet scent of freshly cut wood.",
  "John's reputation as a master carpenter spread throughout the town. People would come from far and wide to commission his work. He loved the challenge of each new project and the satisfaction of seeing his creations in people's homes.",
];

const rewriteSentence = async (sentence, paragraphId, sentenceId, dispatch) => {
  try {
    let revised_sentence = null;
    const onChunk = (data) => {
      console.log(data);
      let response = JSON.parse(data);

      //   console.log(response);
      if (response.status == "rewriting") {
        dispatch({
          type: "SET_SENTENCE_STATUS",
          payload: {
            key: `${paragraphId}-${sentenceId}`,
            status: "rewriting",
          },
        });
      } else if (response.status == "complete") {
        revised_sentence = response.revised_sentence;
      } else if (response.status == "ok") {
        dispatch({
          type: "SET_SENTENCE_STATUS",
          payload: {
            key: `${paragraphId}-${sentenceId}`,
            status: "ok",
          },
        });
        revised_sentence = response.revised_sentence;
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
        instruction: "Change John's profession to a chef.",
      },
      onChunk,
      onError
    );
    return revised_sentence;
  } catch (error) {
    return null;
  }
};

const rewritingReducer = (state, action) => {
  switch (action.type) {
    case "START_REWRITING":
      return {
        ...state,
        isRewriting: true,
        currentParagraph: 0,
        currentSentence: -1,
        sentenceStatuses: {},
        rewrittenSentences: {},
      };
    case "RESET_DEMO":
      return {
        ...state,
        isRewriting: false,
        currentParagraph: 0,
        currentSentence: -1,
        sentenceStatuses: {},
        rewrittenSentences: {},
        paragraphs: INITIAL_PARAGRAPHS,
      };
    case "NEXT_SENTENCE":
      return { ...state, currentSentence: state.currentSentence + 1 };
    case "NEXT_PARAGRAPH":
      return {
        ...state,
        currentParagraph: state.currentParagraph + 1,
        currentSentence: -1,
      };
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
    case "ACCEPT_REWRITE":
      const { key, newSentence } = action.payload;
      const [pIndex, sIndex] = key.split("-").map(Number);
      const updatedParagraphs = [...state.paragraphs];
      const sentences = updatedParagraphs[pIndex].split(".");
      sentences[sIndex] = newSentence;
      updatedParagraphs[pIndex] = sentences.join(".");

      return {
        ...state,
        paragraphs: updatedParagraphs,
        sentenceStatuses: { ...state.sentenceStatuses, [key]: "accepted" },
        rewrittenSentences: {
          ...state.rewrittenSentences,
          [key]: null,
        },
      };
    case "FINISH_REWRITING":
      return { ...state, isRewriting: false };
    default:
      return state;
  }
};

const useRewritingProcess = (state, dispatch) => {
  const { isRewriting, currentSentence, currentParagraph, paragraphs } = state;

  useEffect(() => {
    if (!isRewriting) return;

    const processPassage = async () => {
      const sentences = paragraphs[currentParagraph].split(".");
      if (currentSentence < sentences.length - 1) {
        const nextSentenceId = currentSentence + 1;
        if (sentences[nextSentenceId].trim() !== "") {
          dispatch({
            type: "SET_SENTENCE_STATUS",
            payload: {
              key: `${currentParagraph}-${nextSentenceId}`,
              status: "scanning",
            },
          });
          const rewrittenSentence = await rewriteSentence(
            sentences[nextSentenceId],
            currentParagraph,
            nextSentenceId,
            dispatch
          );
          //   console.log(rewrittenSentence);
          if (rewrittenSentence != null) {
            dispatch({
              type: "SET_REWRITTEN_SENTENCE",
              payload: {
                key: `${currentParagraph}-${nextSentenceId}`,
                sentence: rewrittenSentence,
              },
            });
          } else {
            dispatch({
              type: "SET_SENTENCE_STATUS",
              payload: {
                key: `${currentParagraph}-${nextSentenceId}`,
                status: "ok",
              },
            });
          }
          dispatch({ type: "NEXT_SENTENCE" });
        } else if (currentParagraph < paragraphs.length - 1) {
          dispatch({ type: "NEXT_PARAGRAPH" });
        } else {
          dispatch({ type: "FINISH_REWRITING" });
        }
      }
    };

    processPassage();
  }, [isRewriting, currentSentence, currentParagraph, paragraphs, dispatch]);
};

const Sentence = React.memo(
  ({
    sentence,
    status,
    isCurrentSentence,
    newSentence,
    onAccept,
    onReject,
    sentenceKey,
  }) => {
    const [showLineThrough, setShowLineThrough] = useState(false);

    useEffect(() => {
      if (status === "rewriting") {
        const timer = setTimeout(() => setShowLineThrough(true), 500);
        return () => clearTimeout(timer);
      } else {
        setShowLineThrough(false);
      }
    }, [status]);

    let className = "transition-all duration-300 relative";
    if (status === "scanning") className += " bg-yellow-200";
    else if (status === "rewriting") className += " bg-red-200";
    else if (status === "accepted") className += " bg-green-200";
    const textClassName = `transition-all duration-300 ${
      (showLineThrough && status === "rewriting") || status === "rewrite"
        ? "line-through"
        : ""
    } ${status === "rewrite" ? "text-gray-500" : ""}`;

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
        <span className={textClassName}>{sentence}.</span>
      </span>
    );
  }
);

const Paragraph = React.memo(
  ({
    paragraph,
    pIndex,
    currentParagraph,
    currentSentence,
    isRewriting,
    sentenceStatuses,
    rewrittenSentences,
    onAccept,
    onReject,
  }) => {
    useEffect(() => {
      //   console.log(rewrittenSentences);
    }, [rewrittenSentences]);
    return (
      <p key={pIndex}>
        {paragraph.split(".").map((sentence, sIndex) => {
          if (sentence.trim() === "") return null;
          const key = `${pIndex}-${sIndex}`;
          const isCurrentSentence =
            currentParagraph === pIndex && currentSentence === sIndex;
          const status = sentenceStatuses[key];
          const newSentence =
            status === "rewrite" ? rewrittenSentences[key] : null;

          return (
            <Sentence
              key={key}
              sentence={sentence}
              newSentence={newSentence}
              status={status}
              isCurrentSentence={isCurrentSentence && isRewriting}
              onAccept={onAccept}
              onReject={onReject}
              sentenceKey={key}
            />
          );
        })}
      </p>
    );
  }
);

const RewritingDemo = () => {
  const [state, dispatch] = useReducer(rewritingReducer, {
    paragraphs: INITIAL_PARAGRAPHS,
    currentParagraph: 0,
    currentSentence: -1,
    isRewriting: false,
    sentenceStatuses: {},
    rewrittenSentences: {},
  });

  const {
    paragraphs,
    currentParagraph,
    currentSentence,
    isRewriting,
    sentenceStatuses,
    rewrittenSentences,
  } = state;

  useRewritingProcess(state, dispatch);

  const startRewriting = useCallback(
    () => dispatch({ type: "START_REWRITING" }),
    []
  );
  const resetDemo = useCallback(() => dispatch({ type: "RESET_DEMO" }), []);

  const handleAccept = useCallback((key, newSentence) => {
    dispatch({ type: "ACCEPT_REWRITE", payload: { key, newSentence } });
  }, []);

  const handleReject = useCallback((key) => {
    dispatch({ type: "SET_SENTENCE_STATUS", payload: { key, status: "ok" } });
  }, []);

  const memoizedParagraphs = useMemo(
    () =>
      paragraphs.map((paragraph, pIndex) => (
        <Paragraph
          key={pIndex}
          paragraph={paragraph}
          pIndex={pIndex}
          currentParagraph={currentParagraph}
          currentSentence={currentSentence}
          isRewriting={isRewriting}
          sentenceStatuses={sentenceStatuses}
          rewrittenSentences={rewrittenSentences}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )),
    [
      paragraphs,
      currentParagraph,
      currentSentence,
      isRewriting,
      sentenceStatuses,
      handleAccept,
      handleReject,
    ]
  );

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative p-6 sm:p-3 sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div>
            <h1 className="text-2xl font-semibold mb-4">
              AI Paragraph Rewriting Demo
            </h1>
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                {memoizedParagraphs}
              </div>
              <div className="pt-6 text-base leading-6 font-bold sm:text-lg sm:leading-7">
                <div className="flex justify-between items-center">
                  <button
                    onClick={startRewriting}
                    disabled={isRewriting}
                    className={`bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300 flex items-center ${
                      isRewriting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    aria-label={
                      isRewriting ? "Rewriting in progress" : "Start rewriting"
                    }
                  >
                    <FaSync
                      className={`mr-2 ${isRewriting ? "animate-spin" : ""}`}
                    />
                    {isRewriting ? "Rewriting..." : "Start Rewriting"}
                  </button>
                  <button
                    onClick={resetDemo}
                    disabled={isRewriting}
                    className={`bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition-colors duration-300 ${
                      isRewriting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    aria-label="Reset demo"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center">
        <a
          href="https://github.com/yourusername"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700 mx-2"
        >
          <FaGithub className="inline-block mr-1" /> GitHub
        </a>
        <a
          href="https://twitter.com/yourusername"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700 mx-2"
        >
          <FaTwitter className="inline-block mr-1" /> Twitter
        </a>
      </div>
    </div>
  );
};

export default RewritingDemo;
