import React, { useState, useRef, useEffect } from "react";
import "./TextEditor.css";

export const maintainCaretPosition = (event) => {
  const caret = event.target.selectionStart;
  const element = event.target;
  window.requestAnimationFrame(() => {
    element.selectionStart = caret;
    element.selectionEnd = caret;
  });
};

const TextEditor = () => {
  const [editorContent, setEditorContent] = useState();

  const applyStyle = (tag, style = {}) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.extractContents();
    const span = document.createElement(tag);

    Object.keys(style).forEach((key) => {
      span.style[key] = style[key];
    });

    span.appendChild(selectedText);
    range.insertNode(span);
    setEditorContent(document.getElementById("editor").innerHTML);
  };

  const removeStyle = (tag) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const parent = selection.anchorNode.parentNode;

    if (parent.tagName === tag.toUpperCase()) {
      const text = document.createTextNode(parent.innerText);
      parent.parentNode.replaceChild(text, parent);
      setEditorContent(document.getElementById("editor").innerHTML);
    }
  };

  const toggleStyle = (tag, style = {}) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const parent = selection.anchorNode.parentNode;
    if (parent.tagName === tag.toUpperCase()) {
      removeStyle(tag);
    } else {
      applyStyle(tag, style);
    }
  };

  const changeFontSize = () => {
    toggleStyle("span", { fontSize: "24px" });
  };

  const toggleList = (listType) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const parent = selection.anchorNode.parentNode;

    if (parent.tagName === listType.toUpperCase()) {
      // Unwrap the list item
      const list = parent.parentNode;
      const fragment = document.createDocumentFragment();
      while (list.firstChild) {
        fragment.appendChild(list.firstChild);
      }
      list.parentNode.replaceChild(fragment, list);
    } else {
      // Wrap selected text in a list
      const list = document.createElement(listType);
      const listItem = document.createElement("li");
      listItem.appendChild(range.extractContents());
      list.appendChild(listItem);
      range.insertNode(list);
    }
    setEditorContent(document.getElementById("editor").innerHTML);
  };

  const justifyText = (alignment) => {
    toggleStyle("div", { textAlign: alignment });
  };

  const createLink = () => {
    const url = prompt("Enter the URL");
    if (!url) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.appendChild(range.extractContents());
    range.insertNode(anchor);
    setEditorContent(document.getElementById("editor").innerHTML);
  };

  const unlink = () => {
    removeStyle("a");
  };

  return (
    <div>
      <div>
        <button onClick={() => toggleStyle("b")}>Bold</button>
        <button onClick={() => toggleStyle("i")}>Italic</button>
        <button onClick={() => toggleStyle("u")}>Underline</button>
        <button onClick={() => toggleStyle("strike")}>Strikethrough</button>
        <button onClick={changeFontSize}>Font Size</button>
        <button onClick={() => toggleList("ul")}>Unordered List</button>
        <button onClick={() => toggleList("ol")}>Ordered List</button>
        <button onClick={() => justifyText("left")}>Left Align</button>
        <button onClick={() => justifyText("center")}>Center Align</button>
        <button onClick={() => justifyText("right")}>Right Align</button>
        <button onClick={() => justifyText("justify")}>Justify</button>
        <button onClick={createLink}>Create Link</button>
        <button onClick={unlink}>Unlink</button>
      </div>
      <div
        id="editor"
        contentEditable
        dangerouslySetInnerHTML={{ __html: editorContent }}
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          minHeight: "100px",
        }}
        onInput={(e) => setEditorContent(e.currentTarget.innerHTML)}
      />
    </div>
  );
};

export default TextEditor;
