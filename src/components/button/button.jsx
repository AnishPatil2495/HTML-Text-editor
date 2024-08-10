import React from "react";

export const EditorButton = ({ onClick, icon, label, isActive, title }) => {
  return (
    <button
      className='action-buttons'
      style={{
        // padding: "10px 15px",
        // width: "24px",
        // height: "24px",
        // // margin: "5px",
        // borderRadius: "4px",
        // backgroundColor: "#282c34",
        // cursor: "pointer",
        // color: "#ffffff",
        // display: "inline-flex",
        // alignItems: "center",
        // justifyContent: "center",
        // border: isActive ? "1px solid #007BFF" : "",

        borderColor: isActive ? "white" : "",
      }}
      onClick={onClick}
      title={title}>
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
};
