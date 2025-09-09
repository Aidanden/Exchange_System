// This file is deprecated. Use nationalitsApi.ts with RTK Query instead.
// The nationalitsApi.ts file already uses the correct approach with:
// - process.env.NEXT_PUBLIC_API_BASE_URL for base URL
// - next.config.ts rewrites for API routing
// - RTK Query for better caching and state management

import { createSlice } from "@reduxjs/toolkit";

// This slice is kept for backward compatibility but should not be used
// Use nationalitsApi hooks instead:
// - useGetNationalitiesQuery
// - useAddNationalityMutation
// - useUpdateNationalityMutation
// - useDeleteNationalityMutation

interface NationalitsState {
  // Deprecated - use RTK Query state instead
  _deprecated: boolean;
}

const initialState: NationalitsState = {
  _deprecated: true,
};

const nationalitsSlice = createSlice({
  name: "nationalits",
  initialState,
  reducers: {},
});

export default nationalitsSlice.reducer;
