import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: localStorage.getItem("flora_token"),
  user: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("flora_token", action.payload.token);
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem("flora_token");
    }
  }
});

export const { setAuth, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
