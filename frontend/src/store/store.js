import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import flowReducer from "./flowSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    flow: flowReducer
  }
});
