import { useGetDashboardMetricsQuery } from '@/state/dashboardApi';
import React from 'react'


const cardBuys = () => {
  const { data,  isLoading } = useGetDashboardMetricsQuery();
  const buyData = data?.lastBuy || [] ;

  return (
    <div className="flex flex-col justify-between row-span-3 xl:row-span-6 bg-white xl:col-span-1 shadow-md rounded-2xl  col-span-1 md:col-span-2">
    {isLoading ? <div>جاري التحميل ...</div>:<>
    
              {/* HEADER */}
          <div>
            <h2 className="text-lg font-bold  mb-2 px-7 pt-5">
              المشتريات
            </h2>
            <hr />
          </div>

           {/* BODY */}
           <div>
            {/* BODY HEADER */}
            <div className="flex justify-between items-center mb-6 px-7 mt-5">
              <div className="text-lg font-medium">
                <p className="text-xs text-gray-400">القيمة</p>
                <span className="text-2xl font-extrabold">
                  {/*
                  {(totalValueSum / 1000000).toLocaleString("en", {
                    maximumFractionDigits: 2,
                  })}
                  */}
                </span>
                <span className="text-green-500 text-sm ml-2">
                 {/* <TrendingUp className="inline w-4 h-4 mr-1" />
                  {averageChangePercentage.toFixed(2)}% */}
                </span>
              </div>
               <select
                className="shadow-sm border border-gray-300 bg-white p-2 rounded"
               
              > 
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
      </>}
    
  </div>

  )
}

export default cardBuys