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
  const [activeCommand, setActiveCommand] = useState("");
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
    setActiveCommand(command); // Set the active command
  };

  const execCommandWithValue = (command, value) => {
    document.execCommand(command, false, value);
    setActiveCommand(value); // Set the active command
  };

  const handleHeadingChange = (e) => {
    const value = e.target.value;
    if (value === "paragraph") {
      execCommandWithValue("formatBlock", "p");
    } else {
      execCommandWithValue("formatBlock", value);
    }
  };

  return (
    <div className="text-editor">
      <div className="toolbar">
        <select
          className="heading-dropdown"
          onChange={handleHeadingChange}
          value={activeCommand}
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
        </select>
        <EditorButton
          onClick={() => execCommand("bold")}
          icon={icons.bold}
          isActive={activeCommand === "bold"}
        />
        <EditorButton
          onClick={() => execCommand("italic")}
          icon={icons.italic}
          isActive={activeCommand === "italic"}
        />
        <EditorButton
          onClick={() => execCommand("underline")}
          icon={icons.underline}
          isActive={activeCommand === "underline"}
        />
        <EditorButton
          onClick={() => execCommand("strikeThrough")}
          icon={icons.strikethrough}
          isActive={activeCommand === "strikeThrough"}
        />
        <EditorButton
          onClick={() => execCommand("insertUnorderedList")}
          icon={icons.unorderedlist}
          isActive={activeCommand === "insertUnorderedList"}
        />
        <EditorButton
          onClick={() => execCommand("insertOrderedList")}
          icon={icons.orderedlist}
          isActive={activeCommand === "insertOrderedList"}
        />
        <EditorButton
          onClick={() => execCommand("justifyLeft")}
          icon={icons.alignLeft}
          isActive={activeCommand === "justifyLeft"}
        />
        <EditorButton
          onClick={() => execCommand("justifyCenter")}
          icon={icons.alightCenter}
          isActive={activeCommand === "justifyCenter"}
        />
        <EditorButton
          onClick={() => execCommand("justifyRight")}
          icon={icons.alignRight}
          isActive={activeCommand === "justifyRight"}
        />
        <EditorButton
          onClick={() => execCommand("justifyFull")}
          icon={icons.alignJustify}
          isActive={activeCommand === "justifyFull"}
        />
        <EditorButton
          onClick={() => execCommand("createLink")}
          icon={icons.link}
          isActive={activeCommand === "createLink"}
        />
        <EditorButton
          onClick={() => execCommand("unlink")}
          icon={icons.unlink}
          isActive={activeCommand === "unlink"}
        />
        <EditorButton icon={icons.image} />
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
