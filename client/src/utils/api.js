// src/utils/api.js

export const streamedApiCall = async (url, method, body, onChunk, onError) => {
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
      //   console.log(chunk);
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.error) {
              // If the API returns an error message, call onError and break the loop
              onError(new Error(data.error));
              return;
            }

            onChunk(data);
          } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            onError(new Error("Error parsing server response"));
            return;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in API call:", error);
    onError(error);
  }
};
