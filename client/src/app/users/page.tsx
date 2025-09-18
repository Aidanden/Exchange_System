"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  User,
  Filter
} from "lucide-react";
import { useGetUsersQuery, useCreateUserMutation, useDeleteUserMutation, useUpdateUserMutation } from "@/state/usersApi";
import PermissionGuard from "@/components/PermissionGuard";
import { toast } from "react-hot-toast";

// Types
interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  color: string;
}

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

const UsersPage = () => {
  const { data: usersData, refetch } = useGetUsersQuery();
  const [createUser] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [updateUser] = useUpdateUserMutation();
  
  const [users, setUsers] = useState<User[]>([]);
  
  // تحديث المستخدمين عند وصول البيانات
  useEffect(() => {
    if (usersData?.success && usersData.data?.users) {
      setUsers(usersData.data.users);
    }
  }, [usersData]);

  const [roles] = useState<UserRole[]>([
    {
      id: "admin",
      name: "مدير النظام",
      permissions: ["all"],
      color: "bg-red-100 text-red-800"
    },
    {
      id: "manager",
      name: "مدير",
      permissions: ["users.view", "users.create", "users.edit", "reports.view", "treasury.view"],
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: "cashier",
      name: "صراف",
      permissions: ["buys.create", "sales.create", "customers.view", "currencies.view"],
      color: "bg-green-100 text-green-800"
    },
    {
      id: "accountant",
      name: "محاسب",
      permissions: ["reports.view", "treasury.view", "debts.view", "buys.view", "sales.view"],
      color: "bg-purple-100 text-purple-800"
    }
  ]);

  const [permissions] = useState<Permission[]>([
    { id: "users.view", name: "عرض المستخدمين", description: "يمكن عرض قائمة المستخدمين", module: "المستخدمين" },
    { id: "users.create", name: "إضافة مستخدم", description: "يمكن إضافة مستخدمين جدد", module: "المستخدمين" },
    { id: "users.edit", name: "تعديل المستخدمين", description: "يمكن تعديل بيانات المستخدمين", module: "المستخدمين" },
    { id: "users.delete", name: "حذف المستخدمين", description: "يمكن حذف المستخدمين", module: "المستخدمين" },
    { id: "buys.create", name: "عمليات الشراء", description: "يمكن إجراء عمليات شراء", module: "الشراء" },
    { id: "sales.create", name: "عمليات البيع", description: "يمكن إجراء عمليات بيع", module: "البيع" },
    { id: "reports.view", name: "عرض التقارير", description: "يمكن عرض التقارير", module: "التقارير" },
    { id: "treasury.view", name: "عرض الخزينة", description: "يمكن عرض حركات الخزينة", module: "الخزينة" },
    { id: "customers.view", name: "عرض الزبائن", description: "يمكن عرض قائمة الزبائن", module: "الزبائن" },
    { id: "currencies.view", name: "عرض العملات", description: "يمكن عرض أسعار العملات", module: "العملات" }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "cashier",
    isActive: true
  });

  const [editUser, setEditUser] = useState({
    id: "",
    username: "",
    fullName: "",
    email: "",
    phone: "",
    role: "cashier",
    isActive: true
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleInfo = (roleId: string) => {
    return roles.find(role => role.id === roleId) || roles[0];
  };

  const handleAddUser = async () => {
    try {
      // تحويل role إلى roleId
      const getRoleId = (roleName: string) => {
        const roleMap: { [key: string]: string } = {
          'admin': 'role_admin_001',
          'manager': 'role_manager_001', 
          'cashier': 'role_cashier_001',
          'accountant': 'role_accountant_001'
        };
        return roleMap[roleName] || 'role_cashier_001';
      };
      
      const result = await createUser({
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        password: newUser.password,
        roleId: getRoleId(newUser.role),
        isActive: newUser.isActive
      }).unwrap();
      
      if (result.success) {
        toast.success('تم إضافة المستخدم بنجاح');
        setNewUser({
          username: "",
          fullName: "",
          email: "",
          phone: "",
          password: "",
          role: "cashier",
          isActive: true
        });
        setShowAddModal(false);
        refetch(); // إعادة تحميل البيانات
      } else {
        toast.error(result.message || 'خطأ في إضافة المستخدم');
      }
    } catch (error) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'خطأ في إضافة المستخدم';
      toast.error(errorMessage);
    }
  };

  const handleEditUser = async () => {
    try {
      // تحويل role إلى roleId
      const getRoleId = (roleName: string) => {
        const roleMap: { [key: string]: string } = {
          'admin': 'role_admin_001',
          'manager': 'role_manager_001', 
          'cashier': 'role_cashier_001',
          'accountant': 'role_accountant_001'
        };
        return roleMap[roleName] || 'role_cashier_001';
      };
      
      const result = await updateUser({
        id: editUser.id,
        userData: {
          username: editUser.username,
          fullName: editUser.fullName,
          email: editUser.email,
          phone: editUser.phone,
          roleId: getRoleId(editUser.role),
          isActive: editUser.isActive
        }
      }).unwrap();
      
      if (result.success) {
        toast.success('تم تحديث المستخدم بنجاح');
        setShowEditModal(false);
        refetch(); // إعادة تحميل البيانات
      } else {
        toast.error(result.message || 'خطأ في تحديث المستخدم');
      }
    } catch (error) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'خطأ في تحديث المستخدم';
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      try {
        const result = await deleteUser(userId).unwrap();
        if (result.success) {
          toast.success('تم حذف المستخدم بنجاح');
          refetch(); // إعادة تحميل البيانات
        } else {
          toast.error(result.message || 'خطأ في حذف المستخدم');
        }
      } catch (error) {
        const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'خطأ في حذف المستخدم';
        toast.error(errorMessage);
      }
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
  };

  return (
    <PermissionGuard requiredPermission="users:read">
      <div className="p-6 font-tajawal">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">إدارة المستخدمين</h1>
        <p className="text-gray-600">إدارة المستخدمين والصلاحيات في النظام</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="البحث عن مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">جميع الأدوار</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowPermissionsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              <Shield className="h-5 w-5" />
              إدارة الصلاحيات
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              إضافة مستخدم
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">المستخدم</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">الدور</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">تاريخ الإنشاء</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">آخر دخول</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleInfo.color}`}>
                        {roleInfo.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {user.isActive ? 'نشط' : 'غير نشط'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-SA') : 'لم يسجل دخول'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditUser({
                              id: user.id,
                              username: user.username,
                              fullName: user.fullName,
                              email: user.email,
                              phone: user.phone,
                              role: user.role,
                              isActive: user.isActive
                            });
                            setShowEditModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-[3] p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">إضافة مستخدم جديد</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المستخدم</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الاسم الكامل</label>
                  <input
                    type="text"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">كلمة المرور</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل كلمة المرور"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الدور</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddUser}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  إضافة المستخدم
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-[3] p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">تعديل المستخدم</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المستخدم</label>
                  <input
                    type="text"
                    value={editUser.username}
                    onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الاسم الكامل</label>
                  <input
                    type="text"
                    value={editUser.fullName}
                    onChange={(e) => setEditUser({...editUser, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={editUser.phone}
                    onChange={(e) => setEditUser({...editUser, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الدور</label>
                  <select
                    value={editUser.role}
                    onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editUserActive"
                    checked={editUser.isActive}
                    onChange={(e) => setEditUser({...editUser, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="editUserActive" className="text-sm font-semibold text-gray-700">
                    المستخدم نشط
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleEditUser}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  حفظ التغييرات
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-[3] p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">إدارة الأدوار والصلاحيات</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Roles */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">الأدوار</h3>
                  <div className="space-y-3">
                    {roles.map(role => (
                      <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${role.color}`}>
                            {role.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {role.permissions.includes('all') ? 'جميع الصلاحيات' : `${role.permissions.length} صلاحية`}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {role.permissions.includes('all') 
                            ? 'صلاحيات كاملة للنظام'
                            : role.permissions.map(permId => 
                                permissions.find(p => p.id === permId)?.name
                              ).join(', ')
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">الصلاحيات المتاحة</h3>
                  <div className="space-y-3">
                    {Object.entries(
                      permissions.reduce((acc, perm) => {
                        if (!acc[perm.module]) acc[perm.module] = [];
                        acc[perm.module].push(perm);
                        return acc;
                      }, {} as Record<string, Permission[]>)
                    ).map(([module, perms]) => (
                      <div key={module} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">{module}</h4>
                        <div className="space-y-2">
                          {perms.map(perm => (
                            <div key={perm.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{perm.name}</span>
                              <span className="text-gray-500 text-xs">{perm.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
};

export default UsersPage;
