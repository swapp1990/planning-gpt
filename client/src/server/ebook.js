import {
  streamedApiCall,
  streamedApiCallBasic,
  regularApiCall,
} from "../utils/api";

const API_VER = "api/v1/";
const API_ENDPOINTS = {
  INSERT: API_VER + "chapters/insert",
  CONTINUE: API_VER + "chapters/continue",
  REWRITE: API_VER + "chapters/rewrite",
  NEWSCENE: API_VER + "chapters/scene/new",
  REWRITESCENE: API_VER + "chapters/scene/rewrite",
  CONTINUESCENE: API_VER + "chapters/scene/continue",
  NEWSCENEPARAGRAPHS: API_VER + "chapters/scene/paragraph/new",
};

const streamChapterApiCall = async (
  endpoint,
  context,
  instruction,
  count = 0,
  onChunk,
  onError,
  isNsfw = false,
  stream = false,
  additionalParams = {}
) => {
  try {
    await streamedApiCall(
      `${process.env.REACT_APP_API_URL}/${endpoint}`,
      "POST",
      {
        context: context,
        instruction,
        count,
        isNsfw,
        stream,
        ...additionalParams,
      },
      onChunk,
      onError
    );
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const regularChapterApiCall = async (
  endpoint,
  context,
  instruction,
  count = 0,
  isNsfw = false
) => {
  try {
    return await regularApiCall(
      `${process.env.REACT_APP_API_URL}/${endpoint}`,
      "POST",
      {
        context: context,
        instruction,
        count,
        isNsfw,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const handleError = (error) => {
  console.log(error);
  throw new Error(error.message || "Error generating content");
};

export const getGeneratedScene = async (
  context,
  instruction,
  count,
  onProgress,
  stream = false
) => {
  let scene = {
    title: null,
    elements: [],
    setting: {},
  };

  const onChunk = (data) => {
    if (data.chunk) {
      if (data.chunk === "[DONE]") {
        // onProgress(scene);
      } else {
        try {
          let parsedChunk = JSON.parse(data.chunk);
          // console.log(parsedChunk);
          if (parsedChunk.type == "title") {
            scene.title = parsedChunk.text;
          }
          if (parsedChunk.location) {
            scene.setting = parsedChunk;
          }
          scene.elements.push(parsedChunk);
          onProgress(scene);
        } catch (error) {
          console.error("Error parsing chunk:", error);
        }
      }
    }
  };

  try {
    onProgress(null);
    if (stream) {
      await streamChapterApiCall(
        API_ENDPOINTS.NEWSCENE,
        context,
        instruction,
        count,
        onChunk,
        handleError,
        false,
        true
      );
    } else {
      scene = await regularChapterApiCall(
        API_ENDPOINTS.NEWSCENE,
        context,
        instruction,
        count
      );
    }

    return scene;
  } catch (error) {
    console.error("Failed to generate paragraphs:", error);
    throw error;
  }
};

export const getRewrittenScene = async (
  context,
  instruction,
  count,
  onProgress
) => {
  let scene = {
    title: null,
    elements: [],
    setting: {},
  };

  const onChunk = (data) => {
    if (data.chunk) {
      if (data.chunk === "[DONE]") {
        // onProgress(scene);
      } else {
        try {
          let parsedChunk = JSON.parse(data.chunk);
          // console.log(parsedChunk);
          if (parsedChunk.type == "title") {
            scene.title = parsedChunk.text;
          }
          if (parsedChunk.location) {
            scene.setting = parsedChunk;
          }
          scene.elements.push(parsedChunk);
          onProgress(scene);
        } catch (error) {
          console.error("Error parsing chunk:", error);
        }
      }
    }
  };

  try {
    onProgress(null);
    await streamChapterApiCall(
      API_ENDPOINTS.REWRITESCENE,
      context,
      instruction,
      count,
      onChunk,
      handleError
    );

    return scene;
  } catch (error) {
    console.error("Failed to generate paragraphs:", error);
    throw error;
  }
};

export const getContinuedScene = async (
  context,
  instruction,
  count,
  onProgress
) => {
  let scene = {
    title: null,
    elements: [],
    setting: {},
  };

  const onChunk = (data) => {
    if (data.chunk) {
      if (data.chunk === "[DONE]") {
        // onProgress(scene);
      } else {
        try {
          let parsedChunk = JSON.parse(data.chunk);
          // console.log(parsedChunk);
          if (parsedChunk.type == "title") {
            scene.title = parsedChunk.text;
          }
          if (parsedChunk.location) {
            scene.setting = parsedChunk;
          }
          scene.elements.push(parsedChunk);
          onProgress(scene);
        } catch (error) {
          console.error("Error parsing chunk:", error);
        }
      }
    }
  };

  try {
    onProgress(null);
    await streamChapterApiCall(
      API_ENDPOINTS.CONTINUESCENE,
      context,
      instruction,
      count,
      onChunk,
      handleError
    );

    return scene;
  } catch (error) {
    console.error("Failed to generate paragraphs:", error);
    throw error;
  }
};

export const getSugggestedText = async (fieldType, current_value, context) => {
  try {
    const response = await regularApiCall(
      `${process.env.REACT_APP_API_URL}/parameters/suggestions`,
      "POST",
      {
        fieldType: fieldType,
        current_value: current_value,
        context: context,
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }
    // console.log(response);
    let suggestions = JSON.parse(response.suggestions);
    if (suggestions.text) {
      return suggestions.text;
    } else {
      return suggestions;
    }
  } catch (error) {
    throw new Error(error);
  }
};

export const getSugggestedList = async (fieldType, current_value, context) => {
  try {
    const response = await regularApiCall(
      `${process.env.REACT_APP_API_URL}/parameters/suggestions`,
      "POST",
      {
        fieldType: fieldType,
        current_value: current_value,
        context: context,
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }
    return JSON.parse(response.suggestions);
  } catch (error) {
    throw new Error(error);
  }
};

export const getSuggestedOutlines = async (
  context,
  instruction,
  num_outlines
) => {
  try {
    const response = await regularApiCall(
      `${process.env.REACT_APP_API_URL}/chapter/continue/outlines`,
      "POST",
      {
        context: context,
        instruction: instruction,
        num_outlines: num_outlines,
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }
    return JSON.parse(response.outlines);
  } catch (error) {
    throw new Error(error);
  }
};

export const getNewParagraphs = async (
  context,
  instruction,
  numParagraphs,
  onProgress,
  isNsfw = false
) => {
  let newParagraphs = [];
  let currentParagraph = "";

  const sendUpdate = () => {
    onProgress([...newParagraphs, currentParagraph.trim()]);
  };

  const onChunk = (data) => {
    if (data.chunk) {
      if (data.chunk === "[DONE]") {
        if (currentParagraph.trim()) {
          newParagraphs.push(currentParagraph.trim());
        }
        sendUpdate();
      } else {
        if (data.chunk.includes("\\n\\n")) {
          let splits = data.chunk.split("\\n\\n");
          currentParagraph += splits[0] + " ";
          newParagraphs.push(currentParagraph.trim());
          currentParagraph = splits[1];
          sendUpdate();
        } else {
          currentParagraph += data.chunk + " ";
          sendUpdate();
        }
      }
    }
  };

  try {
    await streamChapterApiCall(
      API_ENDPOINTS.CONTINUE,
      context,
      instruction,
      numParagraphs,
      onChunk,
      handleError,
      isNsfw
    );

    return newParagraphs;
  } catch (error) {
    console.error("Failed to generate paragraphs:", error);
    throw error;
  }
};

export const getNewSceneParagraphs = async (
  context,
  instruction,
  numParagraphs,
  onProgress,
  isNsfw = false
) => {
  let newParagraphs = [];
  let currentParagraph = "";

  const sendUpdate = () => {
    onProgress([...newParagraphs, currentParagraph.trim()]);
  };

  const onChunk = (data) => {
    if (data.chunk) {
      if (data.chunk === "[DONE]") {
        if (currentParagraph.trim()) {
          newParagraphs.push(currentParagraph.trim());
        }
        sendUpdate();
      } else {
        if (data.chunk.includes("\\n\\n")) {
          let splits = data.chunk.split("\\n\\n");
          currentParagraph += splits[0] + " ";
          newParagraphs.push(currentParagraph.trim());
          currentParagraph = splits[1];
          sendUpdate();
        } else {
          currentParagraph += data.chunk + " ";
          sendUpdate();
        }
      }
    }
  };

  try {
    await streamChapterApiCall(
      API_ENDPOINTS.NEWSCENEPARAGRAPHS,
      context,
      instruction,
      numParagraphs,
      onChunk,
      handleError,
      isNsfw
    );

    return newParagraphs;
  } catch (error) {
    console.error("Failed to generate paragraphs:", error);
    throw error;
  }
};

export const getRewrittenParagraphs = async (
  context,
  instruction,
  originalParagraph,
  numParagraphs,
  onProgress,
  isNsfw = false
) => {
  let rewrittenSentences = [];

  const onChunk = (data) => {
    if (data.chunk) {
      if (data.chunk === "[DONE]") {
        onProgress(rewrittenSentences);
      } else {
        try {
          let parsedChunk = JSON.parse(data.chunk);
          if (parsedChunk.action == "edit") {
            if (
              parsedChunk.rewritten_sentence == parsedChunk.original_sentence
            ) {
              parsedChunk.action = "no_change";
            }
          }
          rewrittenSentences.push(parsedChunk);
          onProgress(rewrittenSentences);
        } catch (error) {
          console.error("Error parsing chunk:", error);
        }
      }
    }
  };

  try {
    await streamChapterApiCall(
      API_ENDPOINTS.REWRITE,
      context,
      instruction,
      numParagraphs,
      onChunk,
      handleError,
      isNsfw,
      { paragraph: originalParagraph }
    );

    return rewrittenSentences;
  } catch (error) {
    console.error("Failed to generate paragraphs:", error);
    throw error;
  }
};

export const getInsertedParagraphs = async (
  context,
  instruction,
  numParagraphs,
  onProgress,
  isNsfw = false
) => {
  let newParagraphs = [];
  let currentParagraph = "";

  const sendUpdate = () => {
    onProgress([...newParagraphs, currentParagraph.trim()]);
  };

  const onChunk = (data) => {
    if (data.chunk) {
      if (data.chunk === "[DONE]") {
        if (currentParagraph.trim()) {
          newParagraphs.push(currentParagraph.trim());
        }
        sendUpdate();
      } else {
        if (data.chunk.includes("\\n\\n")) {
          let splits = data.chunk.split("\\n\\n");
          currentParagraph += splits[0] + " ";
          newParagraphs.push(currentParagraph.trim());
          currentParagraph = splits[1];
          sendUpdate();
        } else {
          currentParagraph += data.chunk + " ";
          sendUpdate();
        }
      }
    }
  };

  try {
    await streamChapterApiCall(
      API_ENDPOINTS.INSERT,
      context,
      instruction,
      numParagraphs,
      onChunk,
      handleError,
      isNsfw
    );

    return newParagraphs;
  } catch (error) {
    console.error("Failed to generate paragraphs:", error);
    throw error;
  }
};

export const getSectionSummary = async (
  context,
  paragraphs,
  previous_summary
) => {
  try {
    const response = await regularApiCall(
      `${process.env.REACT_APP_API_URL}/chapter/section/summary`,
      "POST",
      {
        context: context,
        paragraphs: paragraphs,
        previous_summary: previous_summary,
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }
    return JSON.parse(response.summary);
  } catch (error) {
    throw new Error(error);
  }
};

export const rewriteSentence = async (
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

export const toggleNsfw = async () => {
  try {
    const response = await regularApiCall(
      `${process.env.REACT_APP_API_URL}/nsfw`,
      "POST"
    );

    if (response.error) {
      throw new Error(response.error);
    }
    return response.flag;
  } catch (error) {
    throw new Error(error);
  }
};
