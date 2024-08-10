import React from "react";

export const EditorButton = ({ onClick, icon, label, isActive, title }) => {
  return (
    <button
      style={{
        padding: "10px 15px",
        margin: "5px",
        borderRadius: "4px",
        backgroundColor: "#282c34",
        cursor: "pointer",
        color: "#ffffff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClick}
      title={title}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
};
