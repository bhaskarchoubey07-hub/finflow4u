import React from 'react';

const RiskBadge = ({ grade }) => {
  const styles = {
    A: "bg-green-100 text-green-800 border-green-200",
    B: "bg-blue-100 text-blue-800 border-blue-200",
    C: "bg-yellow-100 text-yellow-800 border-yellow-200",
    D: "bg-red-100 text-red-800 border-red-200",
  };

  const currentStyle = styles[grade] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${currentStyle}`}>
      Grade {grade}
    </span>
  );
};

export default RiskBadge;
