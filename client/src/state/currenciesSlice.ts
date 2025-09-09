// This file is deprecated. Use currenciesApi.ts with RTK Query instead.
// The currenciesApi.ts file already uses the correct approach with:
// - process.env.NEXT_PUBLIC_API_BASE_URL for base URL
// - next.config.ts rewrites for API routing
// - RTK Query for better caching and state management

import { createSlice } from "@reduxjs/toolkit";

// This slice is kept for backward compatibility but should not be used
// Use currenciesApi hooks instead:
// - useGetCurrenciesQuery
// - useAddCurrencyMutation
// - useUpdateCurrencyMutation
// - useDeleteCurrencyMutation

interface CurrenciesState {
  // Deprecated - use RTK Query state instead
  _deprecated: boolean;
}

const initialState: CurrenciesState = {
  _deprecated: true,
};

const currenciesSlice = createSlice({
  name: "currencies",
  initialState,
  reducers: {},
});

export default currenciesSlice.reducer;
