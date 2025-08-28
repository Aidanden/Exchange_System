import Decimal from 'decimal.js';


export interface Currency {
  CarID: string;
  Carrency: string;
  CarrencyCode: string;
  Balance: Decimal;
  UserID: string;
  Exist: boolean;
  CreatedAt: string | Date;
  UpdatedAt: string | Date;
}

export interface Customers {
  CustID: string;
  Customer: string;
  NatID: string;
  passportNumber?: string | null;
  ExpDate?: string | null;
  ReleasePlace?: string | null;
  NationalNumber?: string | null;
  Address?: string | null;
  Phone?: string | null;
  UserID: string;
  Exist: boolean;
  OperDate: Date | string;
  Nationality?: { NatID: string; Nationality: string } | null;
}
  
  export interface Buys {
    BuyID: string;
    BillNum: string;
    BuytTypeID: number;
    CarID: string;
    Value: Decimal;
    BuyPrice: Decimal;
    TotalPrice: Decimal;
    CustID: string;
    FirstNum: string | undefined;
    LastNum: string | undefined;
    BuyDate: Date;
    UserID: string;
    Exist: boolean;
    OperDate: Date;
  }

  export interface Sales {
    SaleID: string;
    BillNum: string;
    CustID: string;
    CarID: string;
    SalePrice: Decimal;
    From: string | undefined;
    To: string | undefined;
    Value: Decimal;
    TotalPrice: Decimal;
    BillDate: Date;
    UserID: string;
    Exist: boolean;
    OperDate: Date;
  }

  export interface ExpanseAccounts {
      ExpAccId: string;
      ExpItemID: string;
      ExpValue: Decimal;
      Statment: string | undefined;
      UserID: string;
      Exist: boolean;
      OperDate: Date;
    }
  
  export interface DashboardMetrics {
    popularCustomer: Customers[];
    lastBuy: Buys[];
    lastSales: Sales[];
    Expanss: ExpanseAccounts[];
  }
  

  export interface Nationality {
    CatID: any;
    NatID: string;
    Nationality: string;
    createdAt?: string;
    updatedAt?: string;
    Categorie?: { Categorie: string } | null;
  }

export interface Category  {
  CatID: string;
  Categorie: String;
}