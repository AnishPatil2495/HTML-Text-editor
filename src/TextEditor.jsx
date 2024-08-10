import React, { useState, useRef, useEffect } from "react";
import "./TextEditor.css";

import { EditorButton } from "./components/button/button";

import { icons } from "./assets";

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
    <div className="text-editor">
      <div className="toolbar">
        <EditorButton onClick={() => execCommand("bold")} icon={icons.bold} />
        <EditorButton
          onClick={() => execCommand("italic")}
          icon={icons.italic}
        />
        <EditorButton
          onClick={() => execCommand("underline")}
          icon={icons.underline}
        />
        <EditorButton
          onClick={() => execCommand("strikeThrough")}
          icon={icons.strikethrough}
        />
        <EditorButton
          onClick={() => execCommandWithValue("formatBlock", "h1")}
          label="H1"
        />
        <EditorButton
          onClick={() => execCommandWithValue("formatBlock", "h2")}
          label="H2"
        />
        <EditorButton
          onClick={() => execCommand("insertUnorderedList")}
          icon={icons.unorderedlist}
        />
        <EditorButton
          onClick={() => execCommand("insertOrderedList")}
          icon={icons.orderedlist}
        />
        <EditorButton
          onClick={() => execCommand("justifyLeft")}
          icon={icons.alignLeft}
        />
        <EditorButton
          onClick={() => execCommand("justifyCenter")}
          icon={icons.alightCenter}
        />
        <EditorButton
          onClick={() => execCommand("justifyRight")}
          icon={icons.alignRight}
        />
        <EditorButton
          onClick={() => execCommand("justifyFull")}
          icon={icons.alignJustify}
        />
        <EditorButton
          onClick={() => execCommand("createLink")}
          icon={icons.link}
        />
        <EditorButton
          onClick={() => execCommand("unlink")}
          icon={icons.unlink}
          isActive={true}
        />
      </div>
      <div
        ref={editorRef}
        className="editor"
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
    </div>
  );
};

export default TextEditor;
