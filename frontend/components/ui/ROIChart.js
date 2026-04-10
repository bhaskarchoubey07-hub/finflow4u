import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ROIChart = ({ data }) => {
  // Mock data if none provided
  const chartData = data && data.length > 0 ? data : [
    { name: 'Jan', roi: 4.2 },
    { name: 'Feb', roi: 5.8 },
    { name: 'Mar', roi: 8.4 },
    { name: 'Apr', roi: 7.9 },
    { name: 'May', roi: 10.2 },
    { name: 'Jun', roi: 12.5 },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Portfolio Performance</h3>
          <p className="text-xs text-gray-500 mt-1">Monthly ROI percentage increase</p>
        </div>
        <div className="bg-green-50 px-3 py-1 rounded-full border border-green-100">
          <span className="text-xs font-bold text-green-700">+12.5% YTD</span>
        </div>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
              type="monotone" 
              dataKey="roi" 
              stroke="#4f46e5" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRoi)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ROIChart;
