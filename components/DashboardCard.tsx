import React from "react";

interface DashboardCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "blue" | "green" | "yellow" | "purple" | "red";
}

const colorMap = {
  blue: {
    bg: "bg-blue-100",
    icon: "text-blue-600",
  },
  green: {
    bg: "bg-green-100",
    icon: "text-green-600",
  },
  yellow: {
    bg: "bg-yellow-100",
    icon: "text-yellow-600",
  },
  purple: {
    bg: "bg-purple-100",
    icon: "text-purple-600",
  },
  red: {
    bg: "bg-red-100",
    icon: "text-red-600",
  },
};

const DashboardCard = ({ icon, label, value, color }: DashboardCardProps) => {
  const colors = colorMap[color];
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`${colors.bg} p-3 rounded-lg`}>
          <div className={colors.icon}>{icon}</div>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
