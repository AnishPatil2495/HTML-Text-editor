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
  const [content, setContent] = useState("");
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.contentEditable = true;
      editor.addEventListener("input", handleInput);
    }
    return () => {
      if (editor) {
        editor.removeEventListener("input", handleInput);
      }
    };
  }, []);

  const handleInput = (e) => {
    maintainCaretPosition(e);
    setContent(e.target.innerHTML);
  };

  const execCommand = (command) => {
    document.execCommand(command, false, null);
  };

  const execCommandWithValue = (command, value) => {
    document.execCommand(command, false, value);
  };

  return (
    <div className='text-editor'>
      <div className='toolbar'>
        <button onClick={() => execCommand("bold")}>Bold</button>
        <button onClick={() => execCommand("italic")}>Italic</button>
        <button onClick={() => execCommand("underline")}>Underline</button>
        <button onClick={() => execCommand("strikeThrough")}>Strike</button>
        <button onClick={() => execCommandWithValue("formatBlock", "h1")}>
          H1
        </button>
        <button onClick={() => execCommandWithValue("formatBlock", "h2")}>
          H2
        </button>
        <button onClick={() => execCommand("insertUnorderedList")}>
          Bullet List
        </button>
        <button onClick={() => execCommand("insertOrderedList")}>
          Numbered List
        </button>
        <button onClick={() => execCommand("justifyLeft")}>Left Align</button>
        <button onClick={() => execCommand("justifyCenter")}>
          Center Align
        </button>
        <button onClick={() => execCommand("justifyRight")}>Right Align</button>
        <button onClick={() => execCommand("justifyFull")}>Justify</button>
        <button onClick={() => execCommand("createLink")}>Insert Link</button>
        <button onClick={() => execCommand("unlink")}>Remove Link</button>
      </div>
      <div
        ref={editorRef}
        className='editor'
        dangerouslySetInnerHTML={{ __html: content }}></div>
    </div>
  );
};

export default TextEditor;
