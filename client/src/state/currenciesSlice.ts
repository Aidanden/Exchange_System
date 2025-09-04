import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface Currency {
  CarID: string;
  Carrency: string;
  CarrencyCode: string;
}

interface CurrenciesState {
  currencies: Currency[];
  loading: boolean;
  error: string | null;
}

const initialState: CurrenciesState = {
  currencies: [],
  loading: false,
  error: null,
};

export const fetchCurrencies = createAsyncThunk(
  "currencies/fetchCurrencies",
  async () => {
    try {
      const response = await axios.get("http://localhost:8002/currencies");
      return response.data;
    } catch (error) {
      throw new Error("Failed to fetch currencies");
    }
  }
);

export const addCurrency = createAsyncThunk(
  "currencies/addCurrency",
  async (currencyData: Omit<Currency, "CarID">) => {
    try {
      const response = await axios.post("http://localhost:8002/currencies", currencyData);
      return response.data;
    } catch (error) {
      throw new Error("Failed to add currency");
    }
  }
);

export const updateCurrency = createAsyncThunk(
  "currencies/updateCurrency",
  async (currencyData: Currency) => {
    try {
      const response = await axios.put(`http://localhost:8002/currencies/${currencyData.CarID}`, currencyData);
      return response.data;
    } catch (error) {
      throw new Error("Failed to update currency");
    }
  }
);

export const deleteCurrency = createAsyncThunk(
  "currencies/deleteCurrency",
  async (CarID: string) => {
    try {
      await axios.delete(`http://localhost:8002/currencies/${CarID}`);
      return CarID;
    } catch (error) {
      throw new Error("Failed to delete currency");
    }
  }
);

const currenciesSlice = createSlice({
  name: "currencies",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.loading = false;
        state.currencies = action.payload;
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      })
      .addCase(addCurrency.fulfilled, (state, action) => {
        state.currencies.push(action.payload);
      })
      .addCase(updateCurrency.fulfilled, (state, action) => {
        const index = state.currencies.findIndex(c => c.CarID === action.payload.CarID);
        if (index !== -1) {
          state.currencies[index] = action.payload;
        }
      })
      .addCase(deleteCurrency.fulfilled, (state, action) => {
        state.currencies = state.currencies.filter(c => c.CarID !== action.payload);
      });
  },
});

export default currenciesSlice.reducer;
