import { combineReducers } from "@reduxjs/toolkit";
import { dashboardApi } from "./dashboardApi";
import { nationalitsApi } from "./nationalitsApi";
import { customersApi } from "./customersApi";
import { buysApi } from "./buysApi";

export const rootApiReducer = combineReducers({
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [nationalitsApi.reducerPath]: nationalitsApi.reducer,
  [customersApi.reducerPath]: customersApi.reducer,
  [buysApi.reducerPath]: buysApi.reducer,
});

export const rootApiMiddleware = [
  dashboardApi.middleware,
  nationalitsApi.middleware,
  customersApi.middleware,
  buysApi.middleware,
];
