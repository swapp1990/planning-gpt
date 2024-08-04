import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  username: null,
  token: null,
  address: "",
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setAddress: (state, action) => {
      state.address = action.payload;
    },
  },
});

export const { setUsername, setToken, setAddress } = userSlice.actions;

export default userSlice.reducer;
