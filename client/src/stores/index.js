import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./UserStore";

const store = configureStore({
  reducer: {
    user: userReducer,
  },
  // Temporary disable serialize check for redux as we store Stream.
  // https://stackoverflow.com/a/63244831
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
