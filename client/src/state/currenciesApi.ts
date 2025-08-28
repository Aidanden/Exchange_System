import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Currency } from "./types";

export const currenciesApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
  reducerPath: "currenciesApi",
  tagTypes: ["Currencies", "Currency"],
  endpoints: (build) => ({
    getCurrencies: build.query<Currency[], void>({
      query: () => "/api/currencies/currencies",
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "Currency" as const, id: c.CarID })),
              { type: "Currencies", id: "LIST" },
            ]
          : [{ type: "Currencies", id: "LIST" }],
    }),
    getCurrency: build.query<Currency, string>({
      query: (carID) => `/api/currencies/currency/${carID}`,
      providesTags: (_res, _err, id) => [{ type: "Currency", id }],
    }),
    addCurrency: build.mutation<Currency, Partial<Currency>>({
      query: (body) => ({
        url: "/api/currencies/add-currency",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Currencies", id: "LIST" }],
    }),
    updateCurrency: build.mutation<
      Currency,
      { carID: string; data: Pick<Currency, "Carrency" | "CarrencyCode"> }
    >({
      query: ({ carID, data }) => ({
        url: `/api/currencies/update-currency/${carID}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_res, _err, { carID }) => [
        { type: "Currency", id: carID },
        { type: "Currencies", id: "LIST" },
      ],
    }),
    deleteCurrency: build.mutation<void, string>({
      query: (carID) => ({
        url: `/api/currencies/delete-currency/${carID}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Currencies", id: "LIST" }],
    }),
    addCurrencyBalance: build.mutation<
      { message: string },
      { carID: string; amount: number }
    >({
      query: ({ carID, amount }) => ({
        url: `/api/currencies/add-balance/${carID}`,
        method: "POST",
        body: { amount },
      }),
      invalidatesTags: (_res, _err, { carID }) => [
        { type: "Currency", id: carID },
        { type: "Currencies", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetCurrenciesQuery,
  useGetCurrencyQuery,
  useAddCurrencyMutation,
  useUpdateCurrencyMutation,
  useDeleteCurrencyMutation,
  useAddCurrencyBalanceMutation,
} = currenciesApi;


