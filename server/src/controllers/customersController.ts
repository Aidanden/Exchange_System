import { Request, Response } from "express";
import prisma from "../models/prismaClient";

// GET /api/customers
// Supports: page, limit, search, natId, exist
export const listCustomers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || "20", 10), 1), 200);
    const search = (req.query.search as string) || "";
    const natId = (req.query.natId as string) || undefined;
    const existParam = req.query.exist as string | undefined;
    const exist = existParam === undefined ? true : existParam === "true";
    const customerTypeParam = req.query.customerType as string | undefined;
    const customerType = customerTypeParam === undefined ? undefined : customerTypeParam === "true";

    const where: any = {
      Exist: exist,
      // إذا لم يتم تحديد نوع العميل، نعرض فقط العملاء من السوق (CustomerType = true)
      ...(customerType !== undefined ? { CustomerType: customerType } : { CustomerType: true }),
      ...(natId ? { NatID: natId } : {}),
      ...(search
        ? {
            OR: [
              { Customer: { contains: search, mode: "insensitive" } },
              { NationalNumber: { contains: search, mode: "insensitive" } },
              { Phone: { contains: search, mode: "insensitive" } },
              { Address: { contains: search, mode: "insensitive" } },
              { passportNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    console.log("Filter - CustomerType:", customerType !== undefined ? customerType : true);
    console.log("This will show customers with CustomerType =", customerType !== undefined ? customerType : true);

    const [total, customers] = await Promise.all([
      prisma.customers.count({ where }),
      prisma.customers.findMany({
        where,
        include: {
          Nationality: true,
        },
        orderBy: { OperDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({ data: customers, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("listCustomers error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCustomerById = async (req: Request,res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await prisma.customers.findUnique({
      where: { CustID: id },
      include: { Nationality: true },
    });

    if (!customer) {
      res.status(404).json({ error: "Not found" });
      return; // stop execution
    }

    res.json(customer);
  } catch (error) {
    console.error("getCustomerById error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// POST /api/customers
export const createCustomer = async (req: Request,res: Response): Promise<void> => {
  try {
    const {
      Customer,
      NatID,
      passportNumber,
      ExpDate,
      ReleasePlace,
      NationalNumber,
      Address,
      Phone,
      UserID,
      CustomerType,
    } = req.body;

    // للتأكد من القيم المستلمة
    console.log("Received CustomerType:", CustomerType);
    console.log("Type of CustomerType:", typeof CustomerType);

    if (!Customer || !NatID) {
      res.status(400).json({ error: "Customer and NatID are required" });
      return; // وقف التنفيذ هنا
    }

    const newCustomer = await prisma.customers.create({
      data: {
        CustID: crypto.randomUUID(),
        Customer,
        NatID,
        passportNumber: passportNumber || null,
        ExpDate: ExpDate || null,
        ReleasePlace: ReleasePlace || null,
        NationalNumber: NationalNumber || null,
        Address: Address || null,
        Phone: Phone || null,
        UserID: UserID || "9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6",
        Exist: true,
        CustomerType: CustomerType !== undefined ? CustomerType : true,
      },
    });

    res.status(201).json(newCustomer);
    return;
  } catch (error) {
    console.error("createCustomer error", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};


// PUT /api/customers/:id
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // للتأكد من القيم المستلمة
    console.log("Update - Received CustomerType:", data.CustomerType);
    console.log("Update - Type of CustomerType:", typeof data.CustomerType);

    const updated = await prisma.customers.update({
      where: { CustID: id },
      data: {
        Customer: data.Customer,
        NatID: data.NatID,
        passportNumber: data.passportNumber ?? null,
        ExpDate: data.ExpDate ?? null,
        ReleasePlace: data.ReleasePlace ?? null,
        NationalNumber: data.NationalNumber ?? null,
        Address: data.Address ?? null,
        Phone: data.Phone ?? null,
        UserID: data.UserID || "9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6",
        CustomerType: data.CustomerType !== undefined ? data.CustomerType : true,
      },
    });
    res.json(updated);
  } catch (error) {
    console.error("updateCustomer error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/customers/:id (soft delete)
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.customers.update({
      where: { CustID: id },
      data: { Exist: false },
    });
    res.status(204).end();
  } catch (error) {
    console.error("deleteCustomer error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


