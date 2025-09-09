"use client";

import React from "react";
import { Shield, ArrowRight, Home } from "lucide-react";
import Link from "next/link";

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-4 font-tajawal">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-12 h-12 text-red-500" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          غير مصرح لك بالدخول
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          عذراً، لا تملك الصلاحيات اللازمة للوصول إلى هذه الصفحة. 
          يرجى التواصل مع مدير النظام للحصول على الصلاحيات المطلوبة.
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold"
          >
            <Home className="w-5 h-5" />
            العودة للرئيسية
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-semibold"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للصفحة السابقة
          </button>
        </div>

        {/* Contact Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>تحتاج مساعدة؟</strong><br />
            تواصل مع مدير النظام للحصول على الصلاحيات المطلوبة
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
