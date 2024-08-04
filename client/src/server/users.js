import axios from "axios";
axios.defaults.baseURL = "https://09ed1e24ce6e.ngrok.app/api";

const login = async (params) => {
  try {
    let url = "/accounts/login";
    let body = {
      username: params.username,
      password: params.pwd,
    };
    const response = await axios.post(url, body);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data.message) {
      return { error: error.response.data.message };
    }
    return { error: "An unexpected error occurred" };
  }
};

const saveImage = async (params, token) => {
  try {
    const response = await axios.put(
      `/sdxl/generate/image/save/${params.taskId}`,
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data.message) {
      return { error: error.response.data.message };
    }
    return { error: "An unexpected error occurred" };
  }
};

export { login, saveImage };
