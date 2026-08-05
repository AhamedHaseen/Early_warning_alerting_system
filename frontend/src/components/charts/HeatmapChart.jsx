import React from 'react';

const HeatmapChart = ({ data }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const periods = ['Period 1 (8-10)', 'Period 2 (10-12)', 'Period 3 (1-3)', 'Period 4 (3-5)'];

  // Grid values (0-100 attendance rate)
  const defaultGrid = [
    [95, 92, 88, 82],
    [90, 94, 85, 78],
    [92, 89, 91, 80],
    [88, 93, 86, 75],
    [84, 80, 72, 65], // Friday afternoon lower
  ];

  const gridData = data && data.length === 5 ? data : defaultGrid;

  const getColorClass = (val) => {
    if (val >= 90) return 'bg-emerald-500 text-white font-semibold';
    if (val >= 80) return 'bg-emerald-400 text-white font-medium';
    if (val >= 70) return 'bg-amber-400 text-slate-900 font-medium';
    return 'bg-red-400 text-white font-semibold';
  };

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-center border-separate border-spacing-1.5">
          <thead>
            <tr>
              <th className="p-2 text-slate-400 font-medium text-left">Day / Slot</th>
              {periods.map((p, idx) => (
                <th key={idx} className="p-2 text-slate-500 font-medium">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, dIdx) => (
              <tr key={dIdx}>
                <td className="p-2 font-bold text-slate-700 text-left bg-slate-50 rounded-lg">{day}</td>
                {periods.map((_, pIdx) => {
                  const val = gridData[dIdx][pIdx];
                  return (
                    <td
                      key={pIdx}
                      className={`p-3 rounded-lg shadow-2xs transition-all hover:scale-105 cursor-pointer ${getColorClass(val)}`}
                      title={`${day} ${periods[pIdx]}: ${val}% Attendance`}
                    >
                      {val}%
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-3 text-[11px] text-slate-500 mt-3">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> 90%+</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block"></span> 80-89%</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span> 70-79%</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-400 inline-block"></span> &lt;70%</span>
      </div>
    </div>
  );
};

export default HeatmapChart;
