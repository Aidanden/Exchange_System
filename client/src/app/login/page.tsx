"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, User, LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { useLoginMutation } from "@/state/authApi";
import { loginStart, loginSuccess, loginFailure } from "@/state/authSlice";
// سنستخدم alert بدلاً من toast مؤقتاً

const LoginPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);
  const [login] = useLoginMutation();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  // إعادة التوجيه إذا كان المستخدم مسجل دخول بالفعل
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      alert("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    dispatch(loginStart());

    try {
      const result = await login({
        username: formData.username,
        password: formData.password,
        rememberMe: formData.rememberMe,
      }).unwrap();

      if (result.success && result.data) {
        // حفظ الـ token وبيانات المستخدم في localStorage
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));
        
        // تحديث Redux state
        dispatch(loginSuccess({
          user: result.data.user,
          token: result.data.token,
        }));
        
        // سيتم التوجيه مباشرة بعد النجاح
        router.push("/dashboard");
      } else {
        dispatch(loginFailure(result.message || "خطأ في تسجيل الدخول"));
        alert(result.message || "خطأ في تسجيل الدخول");
      }
    } catch (err: any) {
      const errorMessage = err?.data?.message || "خطأ في اسم المستخدم أو كلمة المرور";
      dispatch(loginFailure(errorMessage));
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4 font-tajawal" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.svg"
              alt="Al-Manjer Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">نظام الصرافة</h1>
          <p className="text-gray-600">مرحباً بك، يرجى تسجيل الدخول للمتابعة</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2 text-right">
                اسم المستخدم
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right"
                  placeholder="أدخل اسم المستخدم"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 text-right">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pr-10 pl-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right"
                  placeholder="أدخل كلمة المرور"
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            &copy; 2024 Aidanden Company. جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
