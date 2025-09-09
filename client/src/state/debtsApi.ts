import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Debt {
  DebtID: string;
  DebtType: "TAKEN" | "GIVEN";
  DebtorName: string;
  DebtorPhone?: string;
  DebtorAddress?: string;
  CarID: string;
  Amount: string;
  PaidAmount?: string;
  RemainingAmount?: string;
  Description?: string;
  DebtDate: string;
  Status: "ACTIVE" | "PARTIAL" | "PAID" | "RECEIVED";
  RepaymentDate?: string;
  RepaymentAmount?: string;
  UserID: string;
  Exist: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  Currency: {
    CarID: string;
    Carrency: string;
    CarrencyCode: string;
    Balance: string;
  };
  User: {
    UserID: string;
    UserName: string;
    Email: string;
  };
}

export interface CreateDebtRequest {
  DebtType: "TAKEN" | "GIVEN";
  DebtorName: string;
  DebtorPhone?: string;
  DebtorAddress?: string;
  CarID: string;
  Amount: string;
  Description?: string;
  UserID: string;
}

export interface AddDebtPaymentRequest {
  Amount: string;
  Description?: string;
  UserID: string;
}

export interface DebtsSummary {
  currency: string;
  currencyCode: string;
  totalTaken: string;
  totalGiven: string;
  countTaken: number;
  countGiven: number;
}

export interface DebtsListResponse {
  data: Debt[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const debtsApi = createApi({
  reducerPath: "debtsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Cache-Control', 'max-age=30');
      return headers;
    },
  }),
  tagTypes: ["Debt", "Currency", "Treasury"],
  keepUnusedDataFor: 60,
  endpoints: (build) => ({
    // Create a new debt
    createDebt: build.mutation<{ message: string; data: Debt }, CreateDebtRequest>({
      query: (debt) => ({
        url: "/debts/debtsAdd",
        method: "POST",
        body: debt,
      }),
      invalidatesTags: ["Debt", "Currency", "Treasury"],
    }),

    // List debts with filters and pagination
    listDebts: build.query<DebtsListResponse, {
      page?: number;
      limit?: number;
      search?: string;
      debtType?: "TAKEN" | "GIVEN";
      status?: "ACTIVE" | "PAID" | "RECEIVED";
    }>({
      query: (params) => ({
        url: "/debts/debts",
        params,
      }),
      providesTags: ["Debt"],
    }),

    // Get debt by ID
    getDebtById: build.query<{ data: Debt }, string>({
      query: (debtId) => `/debts/${debtId}`,
      providesTags: ["Debt"],
    }),

    // Add debt payment
    addDebtPayment: build.mutation<{ message: string; data: any }, {
      debtId: string;
      data: AddDebtPaymentRequest;
    }>({
      query: ({ debtId, data }) => ({
        url: `/debts/${debtId}/payment`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Debt", "Currency", "Treasury"],
    }),

    // Delete debt
    deleteDebt: build.mutation<{ message: string }, string>({
      query: (debtId) => ({
        url: `/debts/${debtId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Debt"],
    }),

    // Get debts summary
    getDebtsSummary: build.query<{ data: DebtsSummary[] }, void>({
      query: () => "/debts/summary",
      providesTags: ["Debt"],
    }),
  }),
});

export const {
  useCreateDebtMutation,
  useListDebtsQuery,
  useGetDebtByIdQuery,
  useAddDebtPaymentMutation,
  useDeleteDebtMutation,
  useGetDebtsSummaryQuery,
} = debtsApi;

