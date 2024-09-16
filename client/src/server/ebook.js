import {
  streamedApiCall,
  streamedApiCallBasic,
  regularApiCall,
} from "../utils/api";

export const streamInsertedParagraph = async (
  context,
  instruction,
  numParagraphs,
  onChunk,
  onError
) => {
  try {
    await streamedApiCall(
      `${process.env.REACT_APP_API_URL}/chapter/insert`,
      "POST",
      {
        context: context,
        instruction: instruction,
        numParagraphs: numParagraphs,
      },
      onChunk,
      onError
    );
  } catch (error) {
    throw new Error(error);
  }
};

export const streamContinueParagraph = async (
  context,
  instruction,
  numParagraphs,
  onChunk,
  onError
) => {
  try {
    await streamedApiCall(
      `${process.env.REACT_APP_API_URL}/chapter/continue`,
      "POST",
      {
        context: context,
        instruction: instruction,
        numParagraphs: numParagraphs,
      },
      onChunk,
      onError
    );
  } catch (error) {
    throw new Error(error);
  }
};

export const streamRewriteParagraph = async (
  context,
  instruction,
  numParagraphs,
  paragraph,
  onChunk,
  onError
) => {
  try {
    await streamedApiCall(
      `${process.env.REACT_APP_API_URL}/chapter/rewrite`,
      "POST",
      {
        context: context,
        instruction: instruction,
        numParagraphs: numParagraphs,
        paragraph: paragraph,
      },
      onChunk,
      onError
    );
  } catch (error) {
    throw new Error(error);
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
    let text = JSON.parse(response.suggestions).text;
    // console.log(text);
    return text;
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
  onProgress
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

  const onError = (error) => {
    // console.error("Error generating paragraphs:", error);
    throw new Error(error.message || "Error generating paragraphs");
  };

  try {
    await streamContinueParagraph(
      context,
      instruction,
      numParagraphs,
      onChunk,
      onError
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
  onProgress
) => {
  let paragraphs = [];
  let currentParagraph = "";

  const sendUpdate = () => {
    onProgress([...paragraphs, currentParagraph.trim()]);
  };

  const onChunk = (data) => {
    if (data.chunk) {
      if (data.chunk === "[DONE]") {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = "";
          sendUpdate();
        }
      } else {
        if (data.chunk.includes("\\n\\n")) {
          let splits = data.chunk.split("\\n\\n");
          currentParagraph += splits[0];
          paragraphs.push(currentParagraph.trim());
          currentParagraph = splits[1];
          sendUpdate();
        } else {
          currentParagraph += data.chunk + " ";
          sendUpdate();
        }
      }
    }
  };

  const onError = (error) => {
    throw new Error(error.message || "Error generating paragraphs");
  };

  try {
    await streamRewriteParagraph(
      context,
      instruction,
      numParagraphs,
      originalParagraph,
      onChunk,
      onError
    );

    return paragraphs;
  } catch (error) {
    console.error("Failed to generate paragraphs:", error);
    throw error;
  }
};

export const getInsertedParagraphs = async (
  context,
  instruction,
  numParagraphs,
  onProgress
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

  const onError = (error) => {
    // console.error("Error generating paragraphs:", error);
    throw new Error(error.message || "Error generating paragraphs");
  };

  try {
    await streamInsertedParagraph(
      context,
      instruction,
      numParagraphs,
      onChunk,
      onError
    );

    return newParagraphs;
  } catch (error) {
    console.error("Failed to generate paragraphs:", error);
    throw error;
  }
};

export const getSectionSummary = async (context, paragraphs) => {
  try {
    const response = await regularApiCall(
      `${process.env.REACT_APP_API_URL}/chapter/section/summary`,
      "POST",
      {
        context: context,
        paragraphs: paragraphs,
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
