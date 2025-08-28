import { useGetDashboardMetricsQuery } from "@/state/dashboardApi";
import { FileDigit } from "lucide-react";
import React from "react";

const cardPopularCustomer = () => {
  const { data: dashboardMetrics, isLoading } = useGetDashboardMetricsQuery();
  return (
    <div className="row-span-3 xl:row-span-6 bg-white shadow-md rounded-2xl pb-16">
      {isLoading ? (
        <div className="m-5">جاري التحميل ...</div>
      ) : (
        <>
          <h3 className="text-lg font-bold px-7 pb-2 pt-5">
            اخر الزبائن
          </h3>
          <hr/>
          <div className="overflow-auto h-full ">
            {dashboardMetrics?.popularCustomer.map((customer)=>(
                <div
                    key={customer.CustID}
                    className="flex items-center justify-between gap-3 px-5 py-7 border-b">
                   <div>img</div>
                   <div className="flex flex-col justify-between gap-1">
                    <div className="text-gray-700">
                        {customer.Customer}
                    </div>
                        <div className="flex text-sm items-center">
                            <span className="font-bold text-blue-500 text-sm">
                                {customer.Phone}
                            </span>
                            <span className="mx-2">
                                |
                            </span>
                            <div>الرقم الهاتف</div>
                        </div>
                    
                   </div>
                   <div className="flex text-sm items-center">
                    <button className="p-2 rounded-full bg-blue-100 text-blue-600 mr-2">
                       
                    </button>
                    الرقم الوطني : {customer.NationalNumber} 
                   </div>
                </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default cardPopularCustomer;
