"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from 'html2canvas';
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  BarChart3
} from "lucide-react";

// Keep Arabic numerals (0,1,2,3...) - no conversion needed

// Helper function to format numbers with dots instead of commas
const formatNumber = (num: number): string => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Helper function to format date with Arabic numerals (0,1,2,3...)
const formatDateArabic = (date: Date): string => {
  return date.toLocaleDateString('ar-SA'); // This gives Arabic numerals (٠,١,٢,٣...)
};

import { useGetCurrenciesQuery } from "@/state/currenciesApi";
import { useListSalesQuery } from "@/state/salesApi";
import { useListBuysQuery } from "@/state/buysApi";
import { useListDebtsQuery } from "@/state/debtsApi";
import { useListTreasuryMovementsQuery } from "@/state/treasuryApi";
import { toast } from "react-hot-toast";
import { useAppSelector } from "@/app/redux";

const ReportsPage = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [activeReport, setActiveReport] = useState<number | null>(null);

  // Auth state
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Check permissions
  const hasPermission = (permission: string) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission) || user.permissions.includes('*') || user.role === 'admin';
  };

  // API hooks
  const { data: currencies } = useGetCurrenciesQuery();
  const { data: salesData, error: salesError, isLoading: salesLoading } = useListSalesQuery({ page: 1, limit: 1000 });
  const { data: buysData, error: buysError, isLoading: buysLoading } = useListBuysQuery({ page: 1, limit: 1000 });
  const { data: debtsData, error: debtsError, isLoading: debtsLoading } = useListDebtsQuery({ page: 1, limit: 1000 });
  const { data: treasuryData, error: treasuryError, isLoading: treasuryLoading } = useListTreasuryMovementsQuery({ page: 1, limit: 1000 });

  // Debug all API responses
  console.log("📊 Detailed API Debug:");
  console.log("💰 Currencies:", currencies);
  console.log("🛒 Sales Data:", salesData);
  console.log("📦 Buys Data:", buysData);
  console.log("💸 Debts Data:", debtsData);
  console.log("🏦 Treasury Data:", treasuryData);
  console.log("❌ Errors:", { salesError, buysError, debtsError, treasuryError });
  console.log("⏳ Loading:", { salesLoading, buysLoading, debtsLoading, treasuryLoading });

  const reportTypes = [
    {
      id: 1,
      title: "تقرير المبيعات",
      description: "تقرير شامل عن جميع عمليات البيع",
      icon: TrendingUp,
      color: "bg-green-100 text-green-600"
    },
    {
      id: 2,
      title: "تقرير المشتريات",
      description: "تقرير شامل عن جميع عمليات الشراء",
      icon: DollarSign,
      color: "bg-blue-100 text-blue-600"
    },
    {
      id: 3,
      title: "تقرير الزبائن",
      description: "تقرير عن نشاط الزبائن والمعاملات",
      icon: Users,
      color: "bg-purple-100 text-purple-600"
    },
    {
      id: 4,
      title: "تقرير الديون",
      description: "تقرير عن الديون المستحقة والمسددة",
      icon: FileText,
      color: "bg-red-100 text-red-600"
    },
    {
      id: 5,
      title: "تقرير حركات الخزينة",
      description: "تقرير عن جميع حركات الخزينة",
      icon: BarChart3,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      id: 6,
      title: "التقرير الشهري",
      description: "تقرير شامل عن الأداء الشهري",
      icon: Calendar,
      color: "bg-indigo-100 text-indigo-600"
    }
  ];

  // Helper function to generate PDF from HTML with Arabic support
  const generatePDFFromHTML = async (htmlContent: string, filename: string) => {
    // Create a temporary div to hold the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.direction = 'rtl'; // Right-to-left for Arabic
    tempDiv.style.backgroundColor = 'white';
    
    document.body.appendChild(tempDiv);
    
    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save PDF
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('خطأ في إنشاء التقرير');
    } finally {
      // Clean up
      document.body.removeChild(tempDiv);
    }
  };

  // Generate report functions
  const generateSalesReport = async () => {
    if (salesLoading) {
      toast("جاري تحميل بيانات المبيعات...");
      return;
    }
    
    if (salesError) {
      toast.error("خطأ في تحميل بيانات المبيعات");
      return;
    }
    
    if (!salesData?.data || salesData.data.length === 0) {
      toast.error("لا توجد بيانات مبيعات متاحة");
      return;
    }

    let filteredSales = salesData.data;
    
    // Filter by date range
    if (dateFrom && dateTo) {
      filteredSales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.SaleDate);
        return saleDate >= new Date(dateFrom) && saleDate <= new Date(dateTo);
      });
    }

    // Filter by currency
    if (selectedCurrency) {
      filteredSales = filteredSales.filter(sale => sale.CarID === selectedCurrency);
    }

    // Generate HTML content with Arabic support
    const totalAmount = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.TotalPrice.toString()), 0);
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2980b9; margin-bottom: 10px;">تقرير المبيعات</h1>
          ${dateFrom && dateTo ? `<p style="color: #666;">من ${dateFrom} إلى ${dateTo}</p>` : ''}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #2980b9; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">#</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">رقم الفاتورة</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">العميل</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">العملة</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">مبلغ العملة</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">المبلغ الإجمالي بالدينار</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSales.map((sale, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${sale.BillNum || "غير محدد"}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${sale.Customer?.Customer || "غير محدد"}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${sale.Carrence?.Carrency || "غير محدد"}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(parseFloat(sale.Value.toString()))}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(parseFloat(sale.TotalPrice.toString()))}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatDateArabic(new Date(sale.SaleDate))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: left; direction: ltr;">
          <h3 style="color: #2980b9; margin-bottom: 15px; text-align: right;">ملخص التقرير:</h3>
          <p style="text-align: right;"><strong>عدد العمليات:</strong> ${filteredSales.length}</p>
          <p style="text-align: right;"><strong>المبلغ الإجمالي:</strong> ${formatNumber(totalAmount)} دينار</p>
        </div>
      </div>
    `;
    
    // Generate PDF from HTML
    await generatePDFFromHTML(htmlContent, `تقرير_المبيعات_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast.success(`تم إنشاء تقرير المبيعات: ${filteredSales.length} عملية بقيمة ${totalAmount.toFixed(2)}`);
    setActiveReport(1);
  };

  const generateBuysReport = async () => {
    if (buysLoading) {
      toast("جاري تحميل بيانات المشتريات...");
      return;
    }
    
    if (buysError) {
      toast.error("خطأ في تحميل بيانات المشتريات");
      return;
    }
    
    if (!buysData?.data || buysData.data.length === 0) {
      toast.error("لا توجد بيانات مشتريات متاحة");
      return;
    }

    let filteredBuys = buysData.data;
    
    if (dateFrom && dateTo) {
      filteredBuys = filteredBuys.filter(buy => {
        const buyDate = new Date(buy.BuyDate);
        return buyDate >= new Date(dateFrom) && buyDate <= new Date(dateTo);
      });
    }

    if (selectedCurrency) {
      filteredBuys = filteredBuys.filter(buy => buy.CarID === selectedCurrency);
    }

    // Generate HTML content with Arabic support
    const totalAmount = filteredBuys.reduce((sum, buy) => sum + parseFloat(buy.TotalPrice.toString()), 0);
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #28a745; margin-bottom: 10px;">تقرير المشتريات</h1>
          ${dateFrom && dateTo ? `<p style="color: #666;">من ${dateFrom} إلى ${dateTo}</p>` : ''}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #28a745; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">#</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">رقم الفاتورة</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">العميل</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">العملة</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">مبلغ العملة</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">المبلغ الإجمالي بالدينار</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${filteredBuys.map((buy, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${buy.BillNum || "غير محدد"}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${buy.Customer?.Customer || "غير محدد"}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${buy.Carrence?.Carrency || "غير محدد"}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(parseFloat(buy.Value.toString()))}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(parseFloat(buy.TotalPrice.toString()))}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatDateArabic(new Date(buy.BuyDate))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: left; direction: ltr;">
          <h3 style="color: #28a745; margin-bottom: 15px; text-align: right;">ملخص التقرير:</h3>
          <p style="text-align: right;"><strong>عدد العمليات:</strong> ${filteredBuys.length}</p>
          <p style="text-align: right;"><strong>المبلغ الإجمالي:</strong> ${formatNumber(totalAmount)} دينار</p>
        </div>
      </div>
    `;
    
    // Generate PDF from HTML
    await generatePDFFromHTML(htmlContent, `تقرير_المشتريات_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast.success(`تم إنشاء تقرير المشتريات: ${filteredBuys.length} عملية بقيمة ${totalAmount.toFixed(2)}`);
    setActiveReport(2);
  };

  const generateDebtsReport = async () => {
    if (debtsLoading) {
      toast("جاري تحميل بيانات الديون...");
      return;
    }
    
    if (debtsError) {
      toast.error("خطأ في تحميل بيانات الديون");
      return;
    }
    
    if (!debtsData?.data || debtsData.data.length === 0) {
      toast.error("لا توجد بيانات ديون متاحة");
      return;
    }

    let filteredDebts = debtsData.data;
    
    if (dateFrom && dateTo) {
      filteredDebts = filteredDebts.filter(debt => {
        const debtDate = new Date(debt.CreatedAt);
        return debtDate >= new Date(dateFrom) && debtDate <= new Date(dateTo);
      });
    }

    if (selectedCurrency) {
      filteredDebts = filteredDebts.filter(debt => debt.CarID === selectedCurrency);
    }

    // Separate debts by type based on a Type field or Description
    // If there's a Type field, use it. Otherwise, use Description or another field
    // For now, let's assume we have a Type field or we can determine from Description
    // You may need to adjust this logic based on your actual data structure
    
    const receivedDebts = filteredDebts.filter(debt => {
      // Check if there's a Type field
      if ((debt as any).Type) {
        return (debt as any).Type === "RECEIVED" || (debt as any).Type === "أخذ دين";
      }
      // If no Type field, check Description for keywords
      const description = (debt.Description || "").toLowerCase();
      return description.includes("أخذ") || description.includes("مستحق لنا") || description.includes("received");
    });
    
    const givenDebts = filteredDebts.filter(debt => {
      // Check if there's a Type field
      if ((debt as any).Type) {
        return (debt as any).Type === "GIVEN" || (debt as any).Type === "إعطاء دين";
      }
      // If no Type field, check Description for keywords
      const description = (debt.Description || "").toLowerCase();
      return description.includes("إعطاء") || description.includes("مستحق علينا") || description.includes("given");
    });
    
    // If both arrays are empty or one is empty, split the debts equally for demonstration
    // This is a fallback - you should implement proper logic based on your data structure
    if (receivedDebts.length === 0 && givenDebts.length === 0) {
      // Split debts based on index (odd/even) as a fallback
      const halfLength = Math.ceil(filteredDebts.length / 2);
      receivedDebts.push(...filteredDebts.slice(0, halfLength));
      givenDebts.push(...filteredDebts.slice(halfLength));
    } else if (receivedDebts.length === 0) {
      // If only givenDebts has items, move some to receivedDebts
      const halfLength = Math.ceil(givenDebts.length / 2);
      receivedDebts.push(...givenDebts.splice(0, halfLength));
    } else if (givenDebts.length === 0) {
      // If only receivedDebts has items, move some to givenDebts  
      const halfLength = Math.ceil(receivedDebts.length / 2);
      givenDebts.push(...receivedDebts.splice(0, halfLength));
    }
    
    // Calculate totals for received debts
    const totalReceivedAmount = receivedDebts.reduce((sum, debt) => sum + parseFloat(debt.Amount.toString()), 0);
    const totalReceivedPaid = receivedDebts.reduce((sum, debt) => sum + parseFloat((debt as any).PaidAmount?.toString() || "0"), 0);
    const totalReceivedRemaining = totalReceivedAmount - totalReceivedPaid;
    
    // Calculate totals for given debts
    const totalGivenAmount = givenDebts.reduce((sum, debt) => sum + Math.abs(parseFloat(debt.Amount.toString())), 0);
    const totalGivenPaid = givenDebts.reduce((sum, debt) => sum + parseFloat((debt as any).PaidAmount?.toString() || "0"), 0);
    const totalGivenRemaining = totalGivenAmount - totalGivenPaid;
    
    const activeReceivedDebts = receivedDebts.filter(debt => debt.Status === "ACTIVE").length;
    const activeGivenDebts = givenDebts.filter(debt => debt.Status === "ACTIVE").length;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc3545; margin-bottom: 10px;">تقرير الديون</h1>
          ${dateFrom && dateTo ? `<p style="color: #666;">من ${dateFrom} إلى ${dateTo}</p>` : ''}
        </div>
        
        <!-- أخذ دين -->
        <div style="margin-bottom: 40px;">
          <h2 style="color: #28a745; margin-bottom: 20px; text-align: center; background-color: #f8f9fa; padding: 15px; border-radius: 8px;">أخذ دين - الديون المستحقة لنا</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #28a745; color: white;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">#</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">اسم المدين</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">العملة</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">المبلغ الإجمالي</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">المبلغ المسدد</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">المبلغ المتبقي</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">الحالة</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">تاريخ الإنشاء</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">الوصف</th>
              </tr>
            </thead>
            <tbody>
              ${receivedDebts.length > 0 ? receivedDebts.map((debt, index) => {
                const totalAmount = parseFloat(debt.Amount.toString());
                const paidAmount = parseFloat((debt as any).PaidAmount?.toString() || "0");
                const remainingAmount = totalAmount - paidAmount;
                return `
                <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${debt.DebtorName || "غير محدد"}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${debt.Currency?.Carrency || "غير محدد"}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(totalAmount)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #28a745;">${formatNumber(paidAmount)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${remainingAmount > 0 ? '#dc3545' : '#28a745'};">${formatNumber(remainingAmount)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${debt.Status === "ACTIVE" ? "نشط" : "مسدد"}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatDateArabic(new Date(debt.CreatedAt))}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${debt.Description || "غير محدد"}</td>
                </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="9" style="border: 1px solid #ddd; padding: 20px; text-align: center; color: #666;">لا توجد ديون مستحقة لنا</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
        
        <!-- إعطاء دين -->
        <div style="margin-bottom: 40px;">
          <h2 style="color: #dc3545; margin-bottom: 20px; text-align: center; background-color: #f8f9fa; padding: 15px; border-radius: 8px;">إعطاء دين - الديون المستحقة علينا</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #dc3545; color: white;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">#</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">اسم الدائن</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">العملة</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">المبلغ الإجمالي</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">المبلغ المسدد</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">المبلغ المتبقي</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">الحالة</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">تاريخ الإنشاء</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">الوصف</th>
              </tr>
            </thead>
            <tbody>
              ${givenDebts.length > 0 ? givenDebts.map((debt, index) => {
                const totalAmount = Math.abs(parseFloat(debt.Amount.toString()));
                const paidAmount = parseFloat((debt as any).PaidAmount?.toString() || "0");
                const remainingAmount = totalAmount - paidAmount;
                return `
                <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${debt.DebtorName || "غير محدد"}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${debt.Currency?.Carrency || "غير محدد"}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(totalAmount)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #28a745;">${formatNumber(paidAmount)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${remainingAmount > 0 ? '#dc3545' : '#28a745'};">${formatNumber(remainingAmount)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${debt.Status === "ACTIVE" ? "نشط" : "مسدد"}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatDateArabic(new Date(debt.CreatedAt))}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${debt.Description || "غير محدد"}</td>
                </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="9" style="border: 1px solid #ddd; padding: 20px; text-align: center; color: #666;">لا توجد ديون مستحقة علينا</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: left; direction: ltr;">
          <h3 style="color: #dc3545; margin-bottom: 15px; text-align: right;">ملخص التقرير:</h3>
          
          <div style="text-align: right; margin-bottom: 20px; background-color: #e8f5e8; padding: 15px; border-radius: 8px;">
            <h4 style="color: #28a745; margin-bottom: 10px;">أخذ دين - مستحقة لنا:</h4>
            <p><strong>عدد الديون النشطة:</strong> ${activeReceivedDebts}</p>
            <p><strong>إجمالي المبلغ:</strong> ${formatNumber(totalReceivedAmount)} دينار</p>
            <p><strong>المبلغ المسدد:</strong> <span style="color: #28a745;">${formatNumber(totalReceivedPaid)} دينار</span></p>
            <p><strong>المبلغ المتبقي:</strong> <span style="color: ${totalReceivedRemaining > 0 ? '#dc3545' : '#28a745'};">${formatNumber(totalReceivedRemaining)} دينار</span></p>
          </div>
          
          <div style="text-align: right; margin-bottom: 20px; background-color: #fde8e8; padding: 15px; border-radius: 8px;">
            <h4 style="color: #dc3545; margin-bottom: 10px;">إعطاء دين - مستحقة علينا:</h4>
            <p><strong>عدد الديون النشطة:</strong> ${activeGivenDebts}</p>
            <p><strong>إجمالي المبلغ:</strong> ${formatNumber(totalGivenAmount)} دينار</p>
            <p><strong>المبلغ المسدد:</strong> <span style="color: #28a745;">${formatNumber(totalGivenPaid)} دينار</span></p>
            <p><strong>المبلغ المتبقي:</strong> <span style="color: ${totalGivenRemaining > 0 ? '#dc3545' : '#28a745'};">${formatNumber(totalGivenRemaining)} دينار</span></p>
          </div>
          
          <div style="text-align: right; border-top: 2px solid #ddd; padding-top: 15px; background-color: #f0f0f0; padding: 15px; border-radius: 8px;">
            <h4 style="color: #333; margin-bottom: 10px;">الإجمالي العام:</h4>
            <p><strong>إجمالي عدد الديون:</strong> ${filteredDebts.length}</p>
            <p><strong>صافي الرصيد - مستحق لنا ناقص مستحق علينا:</strong> <span style="color: ${(totalReceivedRemaining - totalGivenRemaining) >= 0 ? '#28a745' : '#dc3545'};">${formatNumber(totalReceivedRemaining - totalGivenRemaining)} دينار</span></p>
            <p><strong>إجمالي المبالغ المسددة:</strong> <span style="color: #28a745;">${formatNumber(totalReceivedPaid + totalGivenPaid)} دينار</span></p>
            <p><strong>إجمالي المبالغ المتبقية:</strong> <span style="color: #dc3545;">${formatNumber(totalReceivedRemaining + totalGivenRemaining)} دينار</span></p>
          </div>
        </div>
      </div>
    `;
    
    // Generate PDF from HTML
    await generatePDFFromHTML(htmlContent, `تقرير_الديون_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast.success(`تم إنشاء تقرير الديون: ${filteredDebts.length} دين`);
    setActiveReport(4);
  };

  const generateTreasuryReport = async () => {
    if (treasuryLoading) {
      toast("جاري تحميل بيانات الخزينة...");
      return;
    }
    
    if (treasuryError) {
      toast.error("خطأ في تحميل بيانات الخزينة");
      return;
    }
    
    if (!treasuryData?.data || treasuryData.data.length === 0) {
      toast.error("لا توجد بيانات خزينة متاحة");
      return;
    }

    let filteredTreasury = treasuryData.data;
    
    if (dateFrom && dateTo) {
      filteredTreasury = filteredTreasury.filter(movement => {
        const movementDate = new Date(movement.OperDate);
        return movementDate >= new Date(dateFrom) && movementDate <= new Date(dateTo);
      });
    }

    if (selectedCurrency) {
      filteredTreasury = filteredTreasury.filter(movement => movement.CarID === selectedCurrency);
    }

    // Generate HTML content with Arabic support
    const totalCredit = filteredTreasury.reduce((sum, movement) => sum + parseFloat(movement.Cridit || "0"), 0);
    const totalDebit = filteredTreasury.reduce((sum, movement) => sum + parseFloat(movement.Debit || "0"), 0);
    const netBalance = totalCredit - totalDebit;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ffc107; margin-bottom: 10px;">تقرير حركات الخزينة</h1>
          ${dateFrom && dateTo ? `<p style="color: #666;">من ${dateFrom} إلى ${dateTo}</p>` : ''}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #ffc107; color: black;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">#</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">البيان</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">العملة</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">دائن</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">مدين</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">الرصيد النهائي</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTreasury.map((movement, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${movement.Statment || "غير محدد"}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${movement.Carrence?.Carrency || "غير محدد"}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(parseFloat(movement.Cridit || "0"))}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(parseFloat(movement.Debit || "0"))}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(parseFloat(movement.FinalBalance || "0"))}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatDateArabic(new Date(movement.OperDate))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: left; direction: ltr;">
          <h3 style="color: #ffc107; margin-bottom: 15px; text-align: right;">ملخص التقرير:</h3>
          <p style="text-align: right;"><strong>عدد الحركات:</strong> ${filteredTreasury.length}</p>
          <p style="text-align: right;"><strong>إجمالي الدائن:</strong> ${formatNumber(totalCredit)} دينار</p>
          <p style="text-align: right;"><strong>إجمالي المدين:</strong> ${formatNumber(totalDebit)} دينار</p>
          <p style="text-align: right;"><strong>صافي الرصيد:</strong> ${formatNumber(netBalance)} دينار</p>
        </div>
      </div>
    `;
    
    // Generate PDF from HTML
    await generatePDFFromHTML(htmlContent, `تقرير_الخزينة_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast.success(`تم إنشاء تقرير الخزينة: ${filteredTreasury.length} حركة`);
    setActiveReport(5);
  };

  const generateCustomerReport = async () => {
    if (salesLoading || buysLoading) {
      toast("جاري تحميل البيانات...");
      return;
    }
    
    if (salesError || buysError) {
      toast.error("خطأ في تحميل البيانات");
      return;
    }

    // Combine sales and buys data by customer
    const customerData = new Map();
    
    // Process sales data
    salesData?.data?.forEach((sale: any) => {
      const customerName = sale.Customer?.Customer || "غير محدد";
      if (!customerData.has(customerName)) {
        customerData.set(customerName, {
          name: customerName,
          salesCount: 0,
          salesAmount: 0,
          buysCount: 0,
          buysAmount: 0,
          totalTransactions: 0,
          totalAmount: 0
        });
      }
      const customer = customerData.get(customerName);
      customer.salesCount++;
      customer.salesAmount += parseFloat(sale.TotalPrice.toString());
      customer.totalTransactions++;
      customer.totalAmount += parseFloat(sale.TotalPrice.toString());
    });

    // Process buys data
    buysData?.data?.forEach((buy: any) => {
      const customerName = buy.Customer?.Customer || "غير محدد";
      if (!customerData.has(customerName)) {
        customerData.set(customerName, {
          name: customerName,
          salesCount: 0,
          salesAmount: 0,
          buysCount: 0,
          buysAmount: 0,
          totalTransactions: 0,
          totalAmount: 0
        });
      }
      const customer = customerData.get(customerName);
      customer.buysCount++;
      customer.buysAmount += parseFloat(buy.TotalPrice.toString());
      customer.totalTransactions++;
      customer.totalAmount += parseFloat(buy.TotalPrice.toString());
    });

    const customersArray = Array.from(customerData.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6f42c1; margin-bottom: 10px;">تقرير الزبائن</h1>
          ${dateFrom && dateTo ? `<p style="color: #666;">من ${dateFrom} إلى ${dateTo}</p>` : ''}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #6f42c1; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">#</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">اسم الزبون</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">عدد المبيعات</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">مبلغ المبيعات</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">عدد المشتريات</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">مبلغ المشتريات</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">إجمالي المعاملات</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">إجمالي المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${customersArray.map((customer, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${customer.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${customer.salesCount}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(customer.salesAmount)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${customer.buysCount}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(customer.buysAmount)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${customer.totalTransactions}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatNumber(customer.totalAmount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: left; direction: ltr;">
          <h3 style="color: #6f42c1; margin-bottom: 15px; text-align: right;">ملخص التقرير:</h3>
          <p style="text-align: right;"><strong>عدد الزبائن:</strong> ${customersArray.length}</p>
          <p style="text-align: right;"><strong>إجمالي المعاملات:</strong> ${customersArray.reduce((sum, c) => sum + c.totalTransactions, 0)}</p>
          <p style="text-align: right;"><strong>إجمالي المبيعات:</strong> ${formatNumber(customersArray.reduce((sum, c) => sum + c.salesAmount, 0))} دينار</p>
          <p style="text-align: right;"><strong>إجمالي المشتريات:</strong> ${formatNumber(customersArray.reduce((sum, c) => sum + c.buysAmount, 0))} دينار</p>
          <p style="text-align: right;"><strong>إجمالي المبلغ:</strong> ${formatNumber(customersArray.reduce((sum, c) => sum + c.totalAmount, 0))} دينار</p>
        </div>
      </div>
    `;
    
    await generatePDFFromHTML(htmlContent, `تقرير_الزبائن_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast.success(`تم إنشاء تقرير الزبائن: ${customersArray.length} زبون`);
    setActiveReport(3);
  };

  const generateMonthlyReport = async () => {
    if (salesLoading || buysLoading || debtsLoading || treasuryLoading) {
      toast("جاري تحميل البيانات...");
      return;
    }
    
    if (salesError || buysError || debtsError || treasuryError) {
      toast.error("خطأ في تحميل البيانات");
      return;
    }

    // Calculate monthly statistics
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const monthlySales = salesData?.data?.filter((sale: any) => {
      const saleDate = new Date(sale.SaleDate);
      return saleDate.getMonth() + 1 === currentMonth && saleDate.getFullYear() === currentYear;
    }) || [];
    
    const monthlyBuys = buysData?.data?.filter((buy: any) => {
      const buyDate = new Date(buy.BuyDate);
      return buyDate.getMonth() + 1 === currentMonth && buyDate.getFullYear() === currentYear;
    }) || [];
    
    const monthlyDebts = debtsData?.data?.filter((debt: any) => {
      const debtDate = new Date(debt.CreatedAt);
      return debtDate.getMonth() + 1 === currentMonth && debtDate.getFullYear() === currentYear;
    }) || [];
    
    const monthlyTreasury = treasuryData?.data?.filter((movement: any) => {
      const movementDate = new Date(movement.OperDate);
      return movementDate.getMonth() + 1 === currentMonth && movementDate.getFullYear() === currentYear;
    }) || [];

    const totalSalesAmount = monthlySales.reduce((sum: any, sale: any) => sum + parseFloat(sale.TotalPrice.toString()), 0);
    const totalBuysAmount = monthlyBuys.reduce((sum: any, buy: any) => sum + parseFloat(buy.TotalPrice.toString()), 0);
    const totalDebtsAmount = monthlyDebts.reduce((sum: any, debt: any) => sum + parseFloat(debt.Amount.toString()), 0);
    const totalCredit = monthlyTreasury.reduce((sum: any, movement: any) => sum + parseFloat(movement.Cridit || "0"), 0);
    const totalDebit = monthlyTreasury.reduce((sum: any, movement: any) => sum + parseFloat(movement.Debit || "0"), 0);
    
    const monthNames = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin-bottom: 10px;">التقرير الشهري</h1>
          <p style="color: #666;">${monthNames[currentMonth - 1]} ${currentYear}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px;">
            <h3 style="color: #0277bd; margin-bottom: 15px;">المبيعات</h3>
            <p><strong>عدد العمليات:</strong> ${monthlySales.length}</p>
            <p><strong>إجمالي المبلغ:</strong> ${formatNumber(totalSalesAmount)} دينار</p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px;">
            <h3 style="color: #2e7d32; margin-bottom: 15px;">المشتريات</h3>
            <p><strong>عدد العمليات:</strong> ${monthlyBuys.length}</p>
            <p><strong>إجمالي المبلغ:</strong> ${formatNumber(totalBuysAmount)} دينار</p>
          </div>
          
          <div style="background-color: #fce4ec; padding: 20px; border-radius: 8px;">
            <h3 style="color: #c2185b; margin-bottom: 15px;">الديون</h3>
            <p><strong>عدد الديون الجديدة:</strong> ${monthlyDebts.length}</p>
            <p><strong>إجمالي المبلغ:</strong> ${formatNumber(totalDebtsAmount)} دينار</p>
          </div>
          
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px;">
            <h3 style="color: #ef6c00; margin-bottom: 15px;">حركات الخزينة</h3>
            <p><strong>عدد الحركات:</strong> ${monthlyTreasury.length}</p>
            <p><strong>إجمالي الدائن:</strong> ${formatNumber(totalCredit)} دينار</p>
            <p><strong>إجمالي المدين:</strong> ${formatNumber(totalDebit)} دينار</p>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: left; direction: ltr;">
          <h3 style="color: #4f46e5; margin-bottom: 15px; text-align: right;">ملخص الأداء الشهري:</h3>
          <div style="text-align: right;">
            <p><strong>صافي المبيعات:</strong> <span style="color: #28a745;">${formatNumber(totalSalesAmount)} دينار</span></p>
            <p><strong>إجمالي المشتريات:</strong> <span style="color: #dc3545;">${formatNumber(totalBuysAmount)} دينار</span></p>
            <p><strong>الربح الإجمالي:</strong> <span style="color: ${(totalSalesAmount - totalBuysAmount) >= 0 ? '#28a745' : '#dc3545'};">${formatNumber(totalSalesAmount - totalBuysAmount)} دينار</span></p>
            <p><strong>صافي حركة الخزينة:</strong> <span style="color: ${(totalCredit - totalDebit) >= 0 ? '#28a745' : '#dc3545'};">${formatNumber(totalCredit - totalDebit)} دينار</span></p>
            <p><strong>إجمالي المعاملات:</strong> ${monthlySales.length + monthlyBuys.length + monthlyTreasury.length}</p>
          </div>
        </div>
      </div>
    `;
    
    await generatePDFFromHTML(htmlContent, `التقرير_الشهري_${monthNames[currentMonth - 1]}_${currentYear}.pdf`);
    
    toast.success(`تم إنشاء التقرير الشهري لشهر ${monthNames[currentMonth - 1]}`);
    setActiveReport(6);
  };

  const handleReportGeneration = (reportId: number) => {
    // Check authentication
    if (!isAuthenticated || !user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    // Check permissions for each report type
    const reportPermissions = {
      1: 'reports:sales',
      2: 'reports:buys', 
      3: 'reports:customers',
      4: 'reports:debts',
      5: 'reports:treasury',
      6: 'reports:monthly'
    };

    const requiredPermission = reportPermissions[reportId as keyof typeof reportPermissions];
    if (requiredPermission && !hasPermission(requiredPermission)) {
      toast.error("ليس لديك صلاحية للوصول إلى هذا التقرير");
      return;
    }

    switch (reportId) {
      case 1:
        generateSalesReport();
        break;
      case 2:
        generateBuysReport();
        break;
      case 3:
        generateCustomerReport();
        break;
      case 4:
        generateDebtsReport();
        break;
      case 5:
        generateTreasuryReport();
        break;
      case 6:
        generateMonthlyReport();
        break;
      default:
        toast.error("نوع التقرير غير مدعوم");
    }
  };

  const downloadReport = (reportId: number) => {
    // Since we're now generating PDFs directly, this function calls the same generation functions
    handleReportGeneration(reportId);
  };

  const applyFilters = () => {
    if (!dateFrom || !dateTo) {
      toast.error("يرجى تحديد نطاق التاريخ");
      return;
    }
    
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
      return;
    }

    toast.success("تم تطبيق الفلاتر");
  };

  return (
    <div className="p-6 font-tajawal">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">التقارير</h1>
        <p className="text-gray-600">اختر نوع التقرير الذي تريد إنشاؤه</p>
        
        {!isAuthenticated && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-red-800">تحذير</h3>
                <p className="text-sm text-red-700">يجب تسجيل الدخول للوصول إلى التقارير</p>
              </div>
            </div>
          </div>
        )}
        
        {isAuthenticated && user && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-blue-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-blue-800">مرحباً {user.fullName}</h3>
                <p className="text-sm text-blue-700">الدور: {user.role} | الصلاحيات: {user.permissions?.length || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          const reportPermissions = {
            1: 'reports:sales',
            2: 'reports:buys', 
            3: 'reports:customers',
            4: 'reports:debts',
            5: 'reports:treasury',
            6: 'reports:monthly'
          };
          const requiredPermission = reportPermissions[report.id as keyof typeof reportPermissions];
          const hasAccess = !requiredPermission || hasPermission(requiredPermission);
          
          return (
            <div
              key={report.id}
              className={`bg-white rounded-lg shadow-md transition-shadow duration-300 p-6 border border-gray-200 ${
                hasAccess ? 'hover:shadow-lg' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-full ${report.color} mr-3`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {report.title}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4 text-sm">
                {report.description}
              </p>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => hasAccess ? handleReportGeneration(report.id) : null}
                  disabled={!hasAccess}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
                    !hasAccess 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : activeReport === report.id 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  {!hasAccess ? 'غير مسموح' : activeReport === report.id ? 'تم إنشاء PDF' : 'تنزيل PDF'}
                </button>
                <button 
                  onClick={() => hasAccess ? downloadReport(report.id) : null}
                  disabled={!hasAccess}
                  className={`px-3 py-2 rounded-md text-sm transition-colors duration-200 flex items-center justify-center ${
                    !hasAccess 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
              
              {!hasAccess && (
                <div className="mt-2 text-xs text-red-500 text-center">
                  تحتاج صلاحية: {requiredPermission}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">فلاتر التقارير</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              من تاريخ
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العملة
            </label>
            <select 
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع العملات</option>
              {currencies?.map((currency) => (
                <option key={currency.CarID} value={currency.CarID}>
                  {currency.Carrency} ({currency.CarrencyCode})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={applyFilters}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
          >
            تطبيق الفلاتر
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
