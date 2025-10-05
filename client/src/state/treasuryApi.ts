import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface TreasuryMovement {
  TreaMoveID: string;
  CarID: string;
  OpenBalance: string;
  Cridit: string;
  Debit: string;
  FinalBalance: string;
  Statment: string;
  UserID: string;
  Exist: boolean;
  OperDate: string;
  Carrence: {
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

export interface TreasurySummary {
  currency: string;
  currencyCode: string;
  totalCredit: number;
  totalDebit: number;
  currentBalance: string;
  transactionCount: number;
}

export interface TreasuryMovementsListResponse {
  data: TreasuryMovement[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const treasuryApi = createApi({
  reducerPath: "treasuryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    prepareHeaders: (headers) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["TreasuryMovement"],
  keepUnusedDataFor: 0,
  endpoints: (build) => ({
    // List treasury movements with filters and pagination
    listTreasuryMovements: build.query<TreasuryMovementsListResponse, {
      page?: number;
      limit?: number;
      search?: string;
      carID?: string;
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: "/treasury/movements",
        params,
      }),
      providesTags: ["TreasuryMovement"],
    }),

    // Get treasury movement by ID
    getTreasuryMovementById: build.query<{ data: TreasuryMovement }, string>({
      query: (movementId) => `/treasury/${movementId}`,
      providesTags: ["TreasuryMovement"],
    }),

    // Get treasury summary
    getTreasurySummary: build.query<{ data: TreasurySummary[] }, void>({
      query: () => "/treasury/summary",
      providesTags: ["TreasuryMovement"],
    }),
  }),
});

export const {
  useListTreasuryMovementsQuery,
  useGetTreasuryMovementByIdQuery,
  useGetTreasurySummaryQuery,
} = treasuryApi;
