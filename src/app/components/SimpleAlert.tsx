import React from "react";

const SimpleAlert = ({
  message,
  type = "error",
}: {
  message: string;
  type: string;
}) => {
  const getAlertStyle = () => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-400 text-green-700";
      case "warning":
        return "bg-yellow-100 border-yellow-400 text-yellow-700";
      case "info":
        return "bg-blue-100 border-blue-400 text-blue-700";
      case "error":
      default:
        return "bg-red-100 border-red-400 text-red-700";
    }
  };

  return (
    <div className={`border-l-4 p-4 ${getAlertStyle()}`} role="alert">
      <p className="font-bold">
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </p>
      <p>{message}</p>
    </div>
  );
};

export default SimpleAlert;
