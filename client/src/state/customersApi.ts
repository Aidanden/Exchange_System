import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Customers } from "./types";

type ListResponse = {
  data: Customers[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const customersApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
  reducerPath: "customersApi",
  tagTypes: ["Customers"],
  endpoints: (build) => ({
    listCustomers: build.query<ListResponse, { page?: number; limit?: number; search?: string; natId?: string; exist?: boolean } | void>({
      query: (args) => {
        const params = new URLSearchParams();
        const page = args?.page ?? 1;
        const limit = args?.limit ?? 20;
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (args?.search) params.set("search", args.search);
        if (args?.natId) params.set("natId", args.natId);
        if (typeof args?.exist === "boolean") params.set("exist", String(args.exist));
        return `/api/customers?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((c) => ({ type: "Customers" as const, id: c.CustID })),
              { type: "Customers", id: "LIST" },
            ]
          : [{ type: "Customers", id: "LIST" }],
    }),

    getCustomer: build.query<Customers, string>({
      query: (id) => `/api/customers/${id}`,
      providesTags: (result, _err, id) => [{ type: "Customers", id }],
    }),

    addCustomer: build.mutation<Customers, Partial<Customers>>({
      query: (body) => ({ url: "/api/customers", method: "POST", body }),
      invalidatesTags: [{ type: "Customers", id: "LIST" }],
    }),

    updateCustomer: build.mutation<Customers, Partial<Customers> & { CustID: string }>({
      query: ({ CustID, ...body }) => ({ url: `/api/customers/${CustID}`, method: "PUT", body }),
      invalidatesTags: (result, _err, arg) => [{ type: "Customers", id: arg.CustID }, { type: "Customers", id: "LIST" }],
    }),

    deleteCustomer: build.mutation<void, string>({
      query: (CustID) => ({ url: `/api/customers/${CustID}`, method: "DELETE" }),
      invalidatesTags: (result, _err, id) => [{ type: "Customers", id }, { type: "Customers", id: "LIST" }],
    }),
  }),
});

export const {
  useListCustomersQuery,
  useGetCustomerQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;


