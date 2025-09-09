"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/app/redux";
import { loginSuccess } from "@/state/authSlice";

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // استعادة حالة المصادقة من localStorage عند تحميل التطبيق
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");

    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        dispatch(loginSuccess({ user, token }));
      } catch (error) {
        // إزالة البيانات التالفة
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthProvider;
