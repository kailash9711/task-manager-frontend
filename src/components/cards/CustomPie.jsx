import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import Card from '../ui/Card';

const CustomPie = ({ data ,colors}) => {
  return (
    <div>
      <Card title="Task Distribution">
       <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={100}
              fill="#8884d8"
                labelLine={false}
            >
              {(data || []).map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  // Use the colors prop index, or fallback to entry.colors
                  fill={colors ? colors[index % colors.length] : (entry.colors || "#8884d8")} 
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        </Card>
    </div>
  )
}

export default CustomPie
