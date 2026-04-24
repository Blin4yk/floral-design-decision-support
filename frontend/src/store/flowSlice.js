import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  palette: [],
  harmonyType: "analogous",
  harmonyPartners: [],
  harmonyBaseColor: "",
  imageAnalysis: null,
  photoPreview: "",
  location: null,
  zone: "",
  plants: []
};

const flowSlice = createSlice({
  name: "flow",
  initialState,
  reducers: {
    setPalette(state, action) {
      state.palette = action.payload;
    },
    setHarmony(state, action) {
      state.harmonyType = action.payload.harmonyType;
      state.harmonyPartners = action.payload.partners;
      if (action.payload.baseColor != null) {
        state.harmonyBaseColor = action.payload.baseColor;
      }
    },
    setImageAnalysis(state, action) {
      state.imageAnalysis = action.payload;
    },
    setPhotoPreview(state, action) {
      state.photoPreview = action.payload || "";
    },
    setLocation(state, action) {
      state.location = action.payload.location;
      state.zone = action.payload.zone;
    },
    setPlants(state, action) {
      state.plants = action.payload;
    },
    hydrateFlow(state, action) {
      return { ...state, ...action.payload };
    }
  }
});

export const { setPalette, setHarmony, setImageAnalysis, setPhotoPreview, setLocation, setPlants, hydrateFlow } = flowSlice.actions;
export default flowSlice.reducer;
