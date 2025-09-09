import express from 'express';
import {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  upload,
  uploadPassportDocuments,
  getCustomerPassportDocuments,
  deletePassportDocument,
  downloadPassportDocument,
} from '../controllers/customersController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/customers', authenticateToken, listCustomers);
router.get('/customers/:id', authenticateToken, getCustomerById);
router.post('/customers', authenticateToken, createCustomer);
router.put('/customers/:id', authenticateToken, updateCustomer);
router.delete('/customers/:id', authenticateToken, deleteCustomer);

// Passport document routes
router.post('/customers/:id/passport-documents', authenticateToken, upload.array('documents'), uploadPassportDocuments);
router.get('/customers/:id/passport-documents', authenticateToken, getCustomerPassportDocuments);
router.delete('/customers/:customerId/passport-documents/:documentId', authenticateToken, deletePassportDocument);
router.get('/customers/:customerId/passport-documents/:documentId/download', authenticateToken, downloadPassportDocument);

export default router;


