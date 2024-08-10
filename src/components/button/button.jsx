import React from "react";

export const EditorButton = ({ onClick, icon, label, isActive }) => {
  return (
    <button
      style={{
        padding: "10px 15px",
        margin: "5px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        backgroundColor: "#282c34",
        cursor: "pointer",
        color: "#ffffff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: isActive ? "1px solid #007BFF" : "1px solid #fff",
      }}
      onClick={onClick}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
};
