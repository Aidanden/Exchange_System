import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Sales } from "./types";
import { currenciesApi } from "./currenciesApi";

type ListResponse = {
  data: Sales[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const salesApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
  reducerPath: "salesApi",
  tagTypes: ["Sales", "Currencies", "Currency"],
  endpoints: (build) => ({
    listSales: build.query<ListResponse, { page?: number; limit?: number; search?: string; custId?: string; exist?: boolean } | void>({
      query: (args) => {
        const params = new URLSearchParams();
        const page = args?.page ?? 1;
        const limit = args?.limit ?? 20;
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (args?.search) params.set("search", args.search);
        if (args?.custId) params.set("custId", args.custId);
        if (typeof args?.exist === "boolean") params.set("exist", String(args.exist));
        return `/api/sales?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((s) => ({ type: "Sales" as const, id: s.SaleID })),
              { type: "Sales", id: "LIST" },
            ]
          : [{ type: "Sales", id: "LIST" }],
      // ضمان التحديث عند تغيير المعاملات
      refetchOnMountOrArgChange: true,
    }),

    getSale: build.query<Sales, string>({
      query: (id) => `/api/sales/${id}`,
      providesTags: (result, _err, id) => [{ type: "Sales", id }],
    }),

    createSale: build.mutation<Sales, Partial<Sales> & { PaymentCurrencyID: string }>({
      query: (body) => ({ url: "/api/sales", method: "POST", body }),
      invalidatesTags: [
        { type: "Sales", id: "LIST" },
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

    updateSale: build.mutation<Sales, { id: string; data: Partial<Sales> }>({
      query: ({ id, data }) => ({ url: `/api/sales/${id}`, method: "PUT", body: data }),
      invalidatesTags: (result, _err, { id }) => [
        { type: "Sales", id },
        { type: "Sales", id: "LIST" },
        { type: "Currencies", id: "LIST" },
      ],
    }),

    deleteSale: build.mutation<void, string>({
      query: (SaleID) => ({ url: `/api/sales/${SaleID}`, method: "DELETE" }),
      invalidatesTags: (result, _err, id) => [
        { type: "Sales", id }, 
        { type: "Sales", id: "LIST" },
        { type: "Currencies", id: "LIST" } // تحديث قائمة العملات أيضاً
      ],
      // تحسين التحديث التلقائي مع optimistic update
      async onQueryStarted(saleId, { dispatch, queryFulfilled, getState }) {
        // Optimistic update - إزالة المبيعات من جميع استعلامات القائمة
        const patchResults = [];
        
        // تحديث جميع استعلامات listSales النشطة
        const state = getState() as any;
        const salesQueries = state[salesApi.reducerPath]?.queries;
        
        if (salesQueries) {
          Object.keys(salesQueries).forEach(queryKey => {
            if (queryKey.startsWith('listSales')) {
              const patchResult = dispatch(
                salesApi.util.updateQueryData('listSales', salesQueries[queryKey].originalArgs, (draft) => {
                  if (draft?.data) {
                    draft.data = draft.data.filter(sale => sale.SaleID !== saleId);
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
          // إعادة جلب قائمة المبيعات بعد نجاح الحذف للتأكد من التحديث
          dispatch(
            salesApi.util.invalidateTags([
              { type: "Sales", id: "LIST" },
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
  useListSalesQuery,
  useGetSaleQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
} = salesApi;

