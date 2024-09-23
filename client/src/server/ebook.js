import { streamedApiCall, regularApiCall } from "../utils/api";

const API_VER = "api/v1/";
const API_ENDPOINTS = {
  PAREMETERSUGGESTIONS: API_VER + "parameters/suggestions",
  CHAPTERSUGGESTIONS: API_VER + "chapters/suggestions",
  CHAPTEROUTLINES: API_VER + "chapters/outlines",
  CONTINUE: API_VER + "chapters/continue",
  NEWSCENE: API_VER + "chapters/scene/new",
  REWRITESCENE: API_VER + "chapters/scene/rewrite",
  CONTINUESCENE: API_VER + "chapters/scene/continue",
  NEWSCENEPARAGRAPHS: API_VER + "chapters/scene/paragraph/new",
  REWRITESCENEPARAGRAPHS: API_VER + "chapters/scene/paragraph/rewrite",
  INSERTSCENEPARAGRAPHS: API_VER + "chapters/scene/paragraph/insert",
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

export const getSuggestedChapters = async (
  context,
  instruction = "",
  num_chapters = 3,
  total_chapters = 10
) => {
  try {
    const response = await regularApiCall(
      `${process.env.REACT_APP_API_URL}/${API_ENDPOINTS.CHAPTERSUGGESTIONS}`,
      "POST",
      {
        context: context,
        instruction: instruction,
        number_of_chapters: num_chapters,
        total_chapters: total_chapters,
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }
    return response.suggestions;
  } catch (error) {
    throw new Error(error);
  }
};

export const getSuggestedOutlines = async (context, instruction, count) => {
  try {
    const response = await regularApiCall(
      `${process.env.REACT_APP_API_URL}/${API_ENDPOINTS.CHAPTEROUTLINES}`,
      "POST",
      {
        context: context,
        instruction: instruction,
        count: count,
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }
    return response.outlines;
  } catch (error) {
    throw new Error(error);
  }
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
        API_ENDPOINTS.CONTINUESCENE,
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
        API_ENDPOINTS.CONTINUESCENE,
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

export const getSugggestedText = async (fieldType, current_value, context) => {
  try {
    const response = await regularApiCall(
      `${process.env.REACT_APP_API_URL}/${API_ENDPOINTS.PAREMETERSUGGESTIONS}`,
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
    let suggestions = response.suggestions;
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
  count,
  onProgress,
  isNsfw = false,
  stream = true
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
    if (stream) {
      await streamChapterApiCall(
        API_ENDPOINTS.NEWSCENEPARAGRAPHS,
        context,
        instruction,
        count,
        onChunk,
        handleError,
        isNsfw,
        stream
      );
    } else {
      scene = await regularChapterApiCall(
        API_ENDPOINTS.NEWSCENEPARAGRAPHS,
        context,
        instruction,
        count,
        isNsfw
      );
    }

    return newParagraphs;
  } catch (error) {
    console.error("Failed to generate paragraphs:", error);
    throw error;
  }
};

export const getRewrittenParagraphs = async (
  context,
  instruction,
  count,
  onProgress,
  isNsfw = false,
  stream = true
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
      API_ENDPOINTS.REWRITESCENEPARAGRAPHS,
      context,
      instruction,
      count,
      onChunk,
      handleError,
      isNsfw,
      stream
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
  count,
  onProgress,
  isNsfw = false,
  stream = true
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
      API_ENDPOINTS.INSERTSCENEPARAGRAPHS,
      context,
      instruction,
      count,
      onChunk,
      handleError,
      isNsfw,
      stream
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
