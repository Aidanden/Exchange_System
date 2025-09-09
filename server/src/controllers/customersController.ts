import { Request, Response } from "express";
import prisma from "../models/prismaClient";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { AuthRequest } from "../middleware/auth";

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
          PassportDocuments: {
            where: { Exist: true },
            select: { DocumentID: true }
          }
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
export const createCustomer = async (req: AuthRequest,res: Response): Promise<void> => {
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
        UserID: req.user?.id || "9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6",
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
export const updateCustomer = async (req: AuthRequest, res: Response) => {
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
        UserID: req.user?.id || "9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6",
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req: any, file: any, cb: any) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'passport-documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `passport-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Allow images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// POST /api/customers/:id/passport-documents
export const uploadPassportDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const { id: customerId } = req.params;
    const files = req.files as any[];
    
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    if (!customerId) {
      res.status(400).json({ error: "Customer ID is required" });
      return;
    }

    // Verify customer exists
    const customer = await prisma.customers.findUnique({
      where: { CustID: customerId }
    });

    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    // Create document records in database
    const documentPromises = files.map(file => {
      const documentType = file.mimetype.startsWith('image/') ? 'PASSPORT_IMAGE' : 'PASSPORT_PDF';
      
      return prisma.customerPassportDocuments.create({
        data: {
          CustID: customerId,
          DocumentType: documentType,
          FileName: file.originalname,
          FilePath: file.path,
          FileSize: file.size,
          MimeType: file.mimetype,
          UserID: req.user?.id || "9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6",
        }
      });
    });

    const documents = await Promise.all(documentPromises);

    res.status(201).json({
      message: `Successfully uploaded ${files.length} document(s)`,
      documents: documents
    });

  } catch (error) {
    console.error("uploadPassportDocuments error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/customers/:id/passport-documents
export const getCustomerPassportDocuments = async (req: Request, res: Response) => {
  try {
    const { id: customerId } = req.params;

    const documents = await prisma.customerPassportDocuments.findMany({
      where: {
        CustID: customerId,
        Exist: true
      },
      orderBy: {
        CreatedAt: 'desc'
      }
    });

    res.json(documents);
  } catch (error) {
    console.error("getCustomerPassportDocuments error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/customers/:customerId/passport-documents/:documentId
export const deletePassportDocument = async (req: Request, res: Response) => {
  try {
    const { customerId, documentId } = req.params;

    // Find the document
    const document = await prisma.customerPassportDocuments.findFirst({
      where: {
        DocumentID: documentId,
        CustID: customerId,
        Exist: true
      }
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    // Soft delete the document record
    await prisma.customerPassportDocuments.update({
      where: { DocumentID: documentId },
      data: { Exist: false }
    });

    // Optionally delete the physical file
    try {
      await fs.unlink(document.FilePath);
    } catch (fileError) {
      console.warn("Could not delete physical file:", fileError);
    }

    res.status(204).end();
  } catch (error) {
    console.error("deletePassportDocument error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/customers/:customerId/passport-documents/:documentId/download
export const downloadPassportDocument = async (req: Request, res: Response) => {
  try {
    const { customerId, documentId } = req.params;

    const document = await prisma.customerPassportDocuments.findFirst({
      where: {
        DocumentID: documentId,
        CustID: customerId,
        Exist: true
      }
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    // Check if file exists
    try {
      await fs.access(document.FilePath);
    } catch {
      res.status(404).json({ error: "File not found on server" });
      return;
    }

    res.setHeader('Content-Type', document.MimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.FileName}"`);
    res.sendFile(path.resolve(document.FilePath));

  } catch (error) {
    console.error("downloadPassportDocument error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


