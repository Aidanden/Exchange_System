import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface Buys {
  BuyID: string;
  BillNum: string;
  BuyDate: string;
  CustID: string;
  CarID: string;
  Value: number;
  BuyPrice: number;
  TotalPrice: number;
  PaymentCurrencyID: string;
  Customer?: {
    Customer: string;
  };
  Carrence?: {
    Carrency: string;
    CarrencyCode: string;
  };
}

type ListResponse = {
  data: Buys[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const buysApi = createApi({
  baseQuery: fetchBaseQuery({ 
    baseUrl: "http://localhost:5000/api",
    prepareHeaders: (headers) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  reducerPath: "buysApi",
  tagTypes: ["Buys", "Currencies", "Currency"],
  keepUnusedDataFor: 0,
  endpoints: (build) => ({
    listBuys: build.query<ListResponse, { page?: number; limit?: number; search?: string; custId?: string; exist?: boolean } | void>({
      query: (args) => {
        const params = new URLSearchParams();
        const page = args?.page ?? 1;
        const limit = args?.limit ?? 20;
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (args?.search) params.set("search", args.search);
        if (args?.custId) params.set("custId", args.custId);
        if (typeof args?.exist === "boolean") params.set("exist", String(args.exist));
        return `/buys?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((b) => ({ type: "Buys" as const, id: b.BuyID })),
              { type: "Buys", id: "LIST" },
            ]
          : [{ type: "Buys", id: "LIST" }],
      // Remove automatic refetch to improve performance
    }),

    getBuy: build.query<Buys, string>({
      query: (id) => `/buys/${id}`,
      providesTags: (result, _err, id) => [{ type: "Buys", id }],
    }),

    createBuy: build.mutation<Buys, Partial<Buys> & { PaymentCurrencyID: string }>({
      query: (body) => ({ url: "/buys", method: "POST", body }),
      invalidatesTags: [
        { type: "Buys", id: "LIST" },
        { type: "Currencies", id: "LIST" },
      ],
    }),

    updateBuy: build.mutation<Buys, { id: string; data: Partial<Buys> }>({
      query: ({ id, data }) => ({ url: `/buys/${id}`, method: "PUT", body: data }),
      invalidatesTags: (result, _err, { id }) => [
        { type: "Buys", id },
        { type: "Buys", id: "LIST" },
        { type: "Currencies", id: "LIST" },
      ],
    }),

    deleteBuy: build.mutation<void, string>({
      query: (BuyID) => ({ url: `/buys/${BuyID}`, method: "DELETE" }),
      invalidatesTags: (result, _err, id) => [
        { type: "Buys", id }, 
        { type: "Buys", id: "LIST" },
        { type: "Currencies", id: "LIST" }
      ],
    }),
  }),
});

export const {
  useListBuysQuery,
  useGetBuyQuery,
  useCreateBuyMutation,
  useUpdateBuyMutation,
  useDeleteBuyMutation,
} = buysApi;
