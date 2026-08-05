import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100 text-xs">
        <p className="font-semibold text-slate-800">{payload[0].name}</p>
        <p className="font-bold text-slate-700 mt-1">{payload[0].value} Users ({payload[0].payload.percent}%)</p>
      </div>
    );
  }
  return null;
};

const DoughnutChart = ({ data }) => {
  const defaultData = [
    { name: 'Students', value: 1250, color: '#3b82f6', percent: 82 },
    { name: 'Lecturers', value: 85, color: '#10b981', percent: 12 },
    { name: 'Administrators', value: 12, color: '#8b5cf6', percent: 6 }
  ];

  const chartData = data !== undefined ? data : defaultData;

  return (
    <div className="w-full h-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DoughnutChart;
