# تشغيل خادم قاعدة البيانات والخادم الخلفي والواجهة الأمامية

Write-Host "بدء تشغيل نظام الصرافة..." -ForegroundColor Green

# تشغيل الخادم الخلفي
Write-Host "تشغيل الخادم الخلفي..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'g:\ExchangeSystem\server'; npm run dev"

# انتظار قليل للخادم الخلفي
Start-Sleep -Seconds 3

# تشغيل الواجهة الأمامية
Write-Host "تشغيل الواجهة الأمامية..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'g:\ExchangeSystem\client'; npm run dev"

Write-Host "تم تشغيل النظام بنجاح!" -ForegroundColor Green
Write-Host "الخادم الخلفي: http://localhost:5000" -ForegroundColor Cyan
Write-Host "الواجهة الأمامية: http://localhost:3000" -ForegroundColor Cyan
Write-Host "بيانات تسجيل الدخول:" -ForegroundColor Magenta
Write-Host "اسم المستخدم: admin" -ForegroundColor White
Write-Host "كلمة المرور: admin123" -ForegroundColor White
