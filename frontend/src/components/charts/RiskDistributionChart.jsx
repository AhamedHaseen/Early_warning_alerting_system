import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const defaultData = [
  { name: 'Low Risk', value: 1050, color: '#10b981' }, // Emerald 500
  { name: 'Medium Risk', value: 156, color: '#f59e0b' }, // Amber 500
  { name: 'High Risk', value: 42, color: '#ef4444' } // Red 500
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-100">
        <p className="font-semibold text-slate-800">{payload[0].name}</p>
        <p className="text-sm font-medium" style={{ color: payload[0].payload.color }}>
          {payload[0].value} Students
        </p>
      </div>
    );
  }
  return null;
};

const RiskDistributionChart = ({ data }) => {
  const chartData = data !== undefined ? data : defaultData;

  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-sm hover:opacity-80 transition-opacity duration-300" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-sm font-medium text-slate-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskDistributionChart;
