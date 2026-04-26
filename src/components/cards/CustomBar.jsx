import React from 'react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Card from '../ui/Card';

const CustomBar = ({ data, colors }) => {
  return (
    <div>
      <Card title="Task Chart">
       <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="priority" stroke="#64748b" style={{ fontSize: "12px" }} />
            <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
                color: "#f1f5f9",
              }}
            />
            <Bar dataKey="count" name="Tasks" radius={[8, 8, 0, 0]}>
              {(data || []).map((entry, index) => (
                <Cell key={`bar-cell-${index}`} fill={colors ? colors[index % colors.length] : '#8884d8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </Card>
    </div>
  )
}

export default CustomBar
