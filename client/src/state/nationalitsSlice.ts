import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// تحديد نوع البيانات
interface Nationality {
  NatID: string;
  Nationality: string;
  Exist: boolean;
  Categorie: { Categorie: string };
}

interface NationalitsState {
  nationalities: Nationality[];
  loading: boolean;
  error: string | null;
}

const initialState: NationalitsState = {
  nationalities: [],
  loading: false,
  error: null,
};

// إنشاء الـ Thunk لجلب البيانات
export const fetchNationalits = createAsyncThunk(
  "nationalits/fetchNationalits",
  async () => {
    try {
      const response = await axios.get("http://localhost:8000/nationalits"); // اضبط الرابط حسب الباك إند
      return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error("Failed to fetch data");
    }
  }
);

// إنشاء slice لredux
const nationalitsSlice = createSlice({
  name: "nationalits",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNationalits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNationalits.fulfilled, (state, action) => {
        state.loading = false;
        state.nationalities = action.payload;
      })
      .addCase(fetchNationalits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default nationalitsSlice.reducer;
