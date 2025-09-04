import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Buys } from "./types";
import { currenciesApi } from "./currenciesApi";

type ListResponse = {
  data: Buys[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const buysApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
  reducerPath: "buysApi",
  tagTypes: ["Buys", "Currencies", "Currency"],
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
        return `/api/buys?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((b) => ({ type: "Buys" as const, id: b.BuyID })),
              { type: "Buys", id: "LIST" },
            ]
          : [{ type: "Buys", id: "LIST" }],
    }),

    getBuy: build.query<Buys, string>({
      query: (id) => `/api/buys/${id}`,
      providesTags: (result, _err, id) => [{ type: "Buys", id }],
    }),

    createBuy: build.mutation<Buys, Partial<Buys> & { PaymentCurrencyID: string }>({
      query: (body) => ({ url: "/api/buys", method: "POST", body }),
      invalidatesTags: [
        { type: "Buys", id: "LIST" },
        { type: "Currencies", id: "LIST" }, // تحديث قائمة العملات
      ],
      // تحديث أرصدة العملات المحددة
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // إعادة جلب أرصدة العملات بعد نجاح العملية
          dispatch(
            currenciesApi.util.invalidateTags([
              { type: "Currencies", id: "LIST" },
            ])
          );
          
          // تحديث أرصدة العملات المحددة في العملية
          const { CarID, PaymentCurrencyID } = _;
          if (CarID) {
            dispatch(
              currenciesApi.util.invalidateTags([
                { type: "Currency", id: CarID },
              ])
            );
          }
          if (PaymentCurrencyID) {
            dispatch(
              currenciesApi.util.invalidateTags([
                { type: "Currency", id: PaymentCurrencyID },
              ])
            );
          }
        } catch {
          // في حالة الخطأ، لا نحتاج لفعل شيء
        }
      },
    }),

    updateBuy: build.mutation<Buys, { id: string; data: Partial<Buys> }>({
      query: ({ id, data }) => ({ url: `/api/buys/${id}`, method: "PUT", body: data }),
      invalidatesTags: (result, _err, { id }) => [
        { type: "Buys", id },
        { type: "Buys", id: "LIST" },
        { type: "Currencies", id: "LIST" },
      ],
    }),

    deleteBuy: build.mutation<void, string>({
      query: (BuyID) => ({ url: `/api/buys/${BuyID}`, method: "DELETE" }),
      invalidatesTags: (result, _err, id) => [
        { type: "Buys", id }, 
        { type: "Buys", id: "LIST" },
        { type: "Currencies", id: "LIST" } // تحديث قائمة العملات أيضاً
      ],
      // تحسين التحديث التلقائي مع optimistic update
      async onQueryStarted(buyId, { dispatch, queryFulfilled, getState }) {
        // Optimistic update - إزالة المشتريات من جميع استعلامات القائمة
        const patchResults = [];
        
        // تحديث جميع استعلامات listBuys النشطة
        const state = getState() as any;
        const buysQueries = state[buysApi.reducerPath]?.queries;
        
        if (buysQueries) {
          Object.keys(buysQueries).forEach(queryKey => {
            if (queryKey.startsWith('listBuys')) {
              const patchResult = dispatch(
                buysApi.util.updateQueryData('listBuys', buysQueries[queryKey].originalArgs, (draft) => {
                  if (draft?.data) {
                    draft.data = draft.data.filter(buy => buy.BuyID !== buyId);
                    draft.total = Math.max(0, draft.total - 1);
                  }
                })
              );
              patchResults.push(patchResult);
            }
          });
        }
        
        try {
          await queryFulfilled;
          // إعادة جلب قائمة المشتريات بعد نجاح الحذف للتأكد من التحديث
          dispatch(
            buysApi.util.invalidateTags([
              { type: "Buys", id: "LIST" },
            ])
          );
          // إعادة جلب قائمة العملات بعد نجاح الحذف
          dispatch(
            currenciesApi.util.invalidateTags([
              { type: "Currencies", id: "LIST" },
            ])
          );
        } catch {
          // في حالة الخطأ، إعادة البيانات الأصلية
          patchResults.forEach(patchResult => patchResult.undo());
        }
      },
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
