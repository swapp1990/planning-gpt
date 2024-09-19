// src/utils/api.js
export const streamedApiCallBasic = async (
  url,
  method,
  body,
  onChunk,
  onError
) => {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      onChunk(chunk);
    }
  } catch (error) {
    console.error("Error in API call:", error);
    onError(error);
  }
};

export const streamedApiCall = async (url, method, body, onChunk, onError) => {
  const fetchOptions = {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;
        let data;
        try {
          data = JSON.parse(line);
        } catch (parseError) {
          onError(
            new Error("Error parsing server response: " + parseError.message)
          );
          return;
        }

        if (data.error) {
          onError(new Error(data.error));
          return;
        }

        if (data.chunk && data.chunk.startsWith("I'm sorry")) {
          onError(new Error(data.chunk));
          return;
        }

        onChunk(data);
      }
    }
  } catch (error) {
    console.error("Error in API call:", error);
    onError(error);
  }
};

export const regularApiCall = async (url, method, body) => {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      return { error: data.error };
    }

    return data;
  } catch (error) {
    console.error("Error in API call:", error);
    return { error: "An error occurred while fetching data" };
  }
};
