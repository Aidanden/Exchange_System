"use client";

import { useRef } from "react";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
  Provider,
} from "react-redux";
import globalReducer from "@/state";
import { dashboardApi } from "@/state/dashboardApi";
import { nationalitsApi } from "@/state/nationalitsApi"; // إضافة nationalitsApi
import { currenciesApi } from "@/state/currenciesApi"; // إضافة currenciesApi
import { customersApi } from "@/state/customersApi";
import { buysApi } from "@/state/buysApi";
import { salesApi } from "@/state/salesApi";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import nationalitsReducer from "../state/nationalitsSlice";
import currenciesReducer from "../state/currenciesSlice";

/* REDUX PERSISTENCE */
const createNoopStorage = () => {
  return {
    getItem(_key: any) {
      return Promise.resolve(null);
    },
    setItem(_key: any, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: any) {
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window === "undefined"
    ? createNoopStorage()
    : createWebStorage("local");

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["global", "nationalits", "currencies"], // إضافة العملات إلى القائمة البيضاء
};

/* ROOT REDUCER */
const rootReducer = combineReducers({
  global: globalReducer,
  nationalits: nationalitsReducer, // إضافة nationalitsReducer
  currencies: currenciesReducer, // إضافة currenciesReducer
  /*categories: categoriesReducer,  // إضافة reducer جديد */
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [nationalitsApi.reducerPath]: nationalitsApi.reducer, // إضافة nationalitsApi.reducer
  [currenciesApi.reducerPath]: currenciesApi.reducer, // إضافة currenciesApi.reducer
  [customersApi.reducerPath]: customersApi.reducer,
  [buysApi.reducerPath]: buysApi.reducer,
  [salesApi.reducerPath]: salesApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

/* REDUX STORE */
export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(dashboardApi.middleware, nationalitsApi.middleware, currenciesApi.middleware, customersApi.middleware, buysApi.middleware, salesApi.middleware), // إضافة middleware الخاص بـ APIs
  });
};

/* REDUX TYPES */
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/* PROVIDER */
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore>();
  const persistorRef = useRef<ReturnType<typeof persistStore>>();
  if (!storeRef.current) {
    const store = makeStore();
    storeRef.current = store;
    persistorRef.current = persistStore(store);
    setupListeners(store.dispatch);
  }

  return (
    <Provider store={storeRef.current!}>
      <PersistGate loading={null} persistor={persistorRef.current!}>
        {children}
      </PersistGate>
    </Provider>
  );
}