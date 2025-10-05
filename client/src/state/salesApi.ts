import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface Sales {
  SaleID: string;
  BillNum: string;
  SaleDate: string;
  CustID: string;
  CarID: string;
  Value: number;
  SalePrice: number;
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
  data: Sales[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const salesApi = createApi({
  baseQuery: fetchBaseQuery({ 
    baseUrl: "http://102.213.183.227:5000/api",
    prepareHeaders: (headers) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  reducerPath: "salesApi",
  tagTypes: ["Sales", "Currencies", "Currency"],
  keepUnusedDataFor: 0,
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
        return `/sales?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((s) => ({ type: "Sales" as const, id: s.SaleID })),
              { type: "Sales", id: "LIST" },
            ]
          : [{ type: "Sales", id: "LIST" }],
    }),

    getSale: build.query<Sales, string>({
      query: (id) => `/sales/${id}`,
      providesTags: (result, _err, id) => [{ type: "Sales", id }],
    }),

    createSale: build.mutation<Sales, Partial<Sales> & { PaymentCurrencyID: string }>({
      query: (body) => ({ url: "/sales", method: "POST", body }),
      invalidatesTags: [
        { type: "Sales", id: "LIST" },
        { type: "Currencies", id: "LIST" },
      ],
    }),

    updateSale: build.mutation<Sales, { id: string; data: Partial<Sales> }>({
      query: ({ id, data }) => ({ url: `/sales/${id}`, method: "PUT", body: data }),
      invalidatesTags: (result, _err, { id }) => [
        { type: "Sales", id },
        { type: "Sales", id: "LIST" },
        { type: "Currencies", id: "LIST" },
      ],
    }),

    deleteSale: build.mutation<void, string>({
      query: (SaleID) => ({ url: `/sales/${SaleID}`, method: "DELETE" }),
      invalidatesTags: (result, _err, id) => [
        { type: "Sales", id }, 
        { type: "Sales", id: "LIST" },
        { type: "Currencies", id: "LIST" }
      ],
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

