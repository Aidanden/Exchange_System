# إعداد متغيرات البيئة - Environment Variables Setup

## نظرة عامة
يستخدم المشروع ملف `.env.local` لتخزين متغيرات البيئة الخاصة بالتطوير المحلي.

## الخطوات المطلوبة

### 1. إنشاء ملف `.env.local`
أنشئ ملف جديد في المجلد الجذر للـ client:
```
d:\CODE\Exchange_System\client\.env.local
```

### 2. إضافة المتغيرات المطلوبة
أضف المحتوى التالي إلى الملف:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. تعديل المنفذ (Port) حسب الحاجة
- إذا كان السيرفر يعمل على منفذ **5000**: استخدم `http://localhost:5000/api`
- إذا كان السيرفر يعمل على منفذ **8000**: استخدم `http://localhost:8000/api`
- إذا كان السيرفر يعمل على منفذ آخر: غيّر الرقم حسب المنفذ المستخدم

## ملاحظات مهمة

### لماذا NEXT_PUBLIC_API_URL؟
- البادئة `NEXT_PUBLIC_` تجعل المتغير متاحاً في المتصفح (Client-side)
- بدون هذه البادئة، المتغير يكون متاحاً فقط في الخادم (Server-side)

### الملفات التي تستخدم هذا المتغير
جميع ملفات API في المشروع تستخدم `NEXT_PUBLIC_API_URL`:
- `authApi.ts`
- `buysApi.ts`
- `currenciesApi.ts`
- `customersApi.ts`
- `dashboardApi.ts`
- `debtsApi.ts`
- `nationalitsApi.ts`
- `permissionsApi.ts`
- `salesApi.ts`
- `treasuryApi.ts`
- `usersApi.ts`

### القيمة الافتراضية (Fallback)
إذا لم يتم تعريف `NEXT_PUBLIC_API_URL`، سيستخدم المشروع القيمة الافتراضية:
```
http://localhost:5000/api
```

## التحقق من الإعداد

### 1. تشغيل السيرفر
```bash
cd server
npm run dev
```

### 2. تشغيل الـ Client
```bash
cd client
npm run dev
```

### 3. التحقق من الاتصال
- افتح المتصفح على `http://localhost:3000`
- افتح Developer Tools (F12)
- تحقق من تبويب Network
- يجب أن ترى طلبات API تذهب إلى العنوان المحدد في `.env.local`

## الأمان

### ملفات يجب عدم رفعها إلى Git
- `.env.local` - محمي في `.gitignore`
- `.env` - محمي في `.gitignore`

### ملفات يمكن رفعها إلى Git
- `.env.example` - يحتوي على أمثلة بدون قيم حقيقية
- `ENV_SETUP.md` - هذا الملف التوثيقي

## استكشاف الأخطاء

### المشكلة: API لا يعمل
**الحل:**
1. تأكد من وجود ملف `.env.local`
2. تأكد من صحة عنوان URL
3. تأكد من تشغيل السيرفر على المنفذ الصحيح
4. أعد تشغيل الـ client بعد تعديل `.env.local`

### المشكلة: 404 Not Found
**الحل:**
1. تحقق من أن السيرفر يعمل
2. تحقق من المنفذ في `.env.local`
3. تحقق من أن `/api` موجود في نهاية URL

### المشكلة: CORS Error
**الحل:**
1. تأكد من إعدادات CORS في السيرفر
2. تأكد من أن السيرفر يسمح بطلبات من `http://localhost:3000`

## مثال على الإعداد الكامل

### ملف `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### كود API (مثال من authApi.ts)
```typescript
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    // ...
  }),
  // ...
});
```

## الخلاصة
✅ أنشئ ملف `.env.local` في مجلد client  
✅ أضف `NEXT_PUBLIC_API_URL` مع عنوان السيرفر الصحيح  
✅ أعد تشغيل الـ client بعد التعديل  
✅ تحقق من عمل API في المتصفح  
