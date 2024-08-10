import React, { useState, useEffect, useRef } from "react";
import "./TextEditor.css";
import { EditorButton } from "./components/button/button";
import { icons } from "./assets";
import ContentEditable from "./ContentEditable";

const TextEditor = () => {
  const divRef = useRef(null);
  const [activeCommands, setActiveCommands] = useState([]);
  const [editorContent, setEditorContent] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("p");
  const [fontSize, setFontSize] = useState("24px");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const editorRef = useRef(null);

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

  const undo = () => {
    if (!undoStack.length) return;
    const lastState = undoStack.pop();
    setRedoStack([...redoStack, editorContent]);
    setEditorContent(lastState);
  };

  const redo = () => {
    if (!redoStack.length) return;
    const nextState = redoStack.pop();
    setUndoStack([...undoStack, editorContent]);
    setEditorContent(nextState);
  };

  const removeStyle = (tag) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const parent = selection.anchorNode.parentNode;

    if (parent.tagName === tag) {
      const text = document.createTextNode(parent.innerText);
      parent.parentNode.replaceChild(text, parent);
      setEditorContent(document.getElementById("editor").innerHTML);
    }
  };

  const toggleStyle = (tag, style = {}) => {
    setActiveCommands((prevCommands) => {
      const isActive = prevCommands.includes(tag);
      if (isActive) {
        return prevCommands.filter((cmd) => cmd !== tag);
      } else {
        return [...prevCommands, tag];
      }
    });

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const parent = selection.anchorNode.parentNode;
    if (parent.tagName === tag) {
      removeStyle(tag);
    } else {
      applyStyle(tag, style);
    }
  };

  const changeFontSize = (size) => {
    setFontSize(size);
    toggleStyle("span", { fontSize: size });
  };

  const toggleList = (listType) => {
    setActiveCommands((prevCommands) => {
      const isActive = prevCommands.includes(listType);
      if (isActive) {
        return prevCommands.filter((cmd) => cmd !== listType);
      } else {
        return [...prevCommands, listType];
      }
    });

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const parent = selection.anchorNode.parentNode;

    if (parent.tagName === listType) {
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
    const commandMap = {
      left: "justifyLeft",
      center: "justifyCenter",
      right: "justifyRight",
      justify: "justify",
    };

    // Check if the alignment is already active
    const isActive = activeCommands.includes(commandMap[alignment]);

    // Clear previous alignment commands
    setActiveCommands((prevCommands) => {
      const cleanedCommands = prevCommands.filter(
        (cmd) =>
          cmd !== "justifyLeft" &&
          cmd !== "justifyCenter" &&
          cmd !== "justifyRight" &&
          cmd !== "justify"
      );

      // If the alignment was active, toggle it off, otherwise add the new alignment
      return isActive
        ? cleanedCommands
        : [...cleanedCommands, commandMap[alignment]];
    });

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const parent = selection.anchorNode.parentNode;

    if (isActive) {
      // If the alignment is active, toggle it off by resetting the text alignment
      if (parent && parent.style.textAlign === alignment) {
        parent.style.textAlign = "";
      }
      return;
    }

    // Apply the new alignment
    parent.style.textAlign = alignment;
    setEditorContent(document.getElementById("editor").innerHTML);
  };

  const createLink = () => {
    const url = prompt("Enter the URL");
    if (!url) return;

    setActiveCommands((prevCommands) => [...prevCommands, "a"]);
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
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const parent = selection.anchorNode.parentNode;
    if (parent.tagName === "A") {
      removeStyle("a");
      setActiveCommands((prevCommands) =>
        prevCommands.filter((cmd) => cmd !== "a")
      );
    }
  };

  const changeBlockType = (blockType) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const parent = selection.anchorNode.parentNode;

    const newBlock = document.createElement(blockType);

    newBlock.appendChild(range.extractContents());

    range.insertNode(newBlock);

    const newRange = document.createRange();
    newRange.selectNodeContents(newBlock);
    selection.removeAllRanges();
    selection.addRange(newRange);

    setSelectedBlock(blockType);
    setEditorContent(document.getElementById("editor").innerHTML);
  };

  const checkActiveCommands = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const parent = selection.anchorNode.parentNode;
    const commandMap = {
      B: "b",
      I: "i",
      U: "u",
      STRIKE: "strike",
      UL: "ul",
      OL: "ol",
      A: "a",
      DIV_LEFT: "justifyLeft",
      DIV_CENTER: "justifyCenter",
      DIV_RIGHT: "justifyRight",
      DIV_JUSTIFY: "justify",
      SPAN_24PX: "span",
    };

    const tagName = parent.tagName;
    const style = parent.style;

    let activeCmds = [];
    if (tagName === "DIV") {
      switch (style.textAlign) {
        case "left":
          activeCmds.push(commandMap.DIV_LEFT);
          break;
        case "center":
          activeCmds.push(commandMap.DIV_CENTER);
          break;
        case "right":
          activeCmds.push(commandMap.DIV_RIGHT);
          break;
        case "justify":
          activeCmds.push(commandMap.DIV_JUSTIFY);
          break;
        default:
          activeCmds = activeCmds.filter((cmd) => !cmd.startsWith("justify"));
      }
    } else if (tagName === "SPAN" && style.fontSize === "24px") {
      activeCmds.push(commandMap.SPAN_24PX);
    } else {
      const cmd = commandMap[tagName];
      if (cmd) activeCmds.push(cmd);
    }

    setActiveCommands(activeCmds);

    // Set the selected block type (p, h1, h2, etc.) only if it has changed
    if (["P", "H1", "H2", "H3", "H4", "H5", "H6"].includes(tagName)) {
      setSelectedBlock((prevBlock) => {
        return prevBlock !== tagName.toLowerCase()
          ? tagName.toLowerCase()
          : prevBlock;
      });
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result;

        // Create an image element
        const img = document.createElement("img");
        img.src = url;
        img.style.maxWidth = "100%"; // Ensure the image fits within the editor

        // Prevent image from being removed on click
        img.addEventListener("mousedown", (event) => {
          event.preventDefault();
        });

        // Insert the image at the current selection or at the end of the editor
        const editor = divRef.current;

        if (editor) {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents(); // Remove any selected content
            range.insertNode(img);
            range.collapse(false); // Ensure cursor is placed after the image
          } else {
            editor.appendChild(img);
          }

          // Move cursor to the end after inserting image
          const newRange = document.createRange();
          const newSelection = window.getSelection();
          newRange.selectNodeContents(editor);
          newRange.collapse(false);
          newSelection.removeAllRanges();
          newSelection.addRange(newRange);

          setEditorContent(editor.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    };
  };

  useEffect(() => {
    document
      .getElementById("editor")
      .addEventListener("mouseup", checkActiveCommands);
    document
      .getElementById("editor")
      .addEventListener("keyup", checkActiveCommands);
  }, []);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setUndoStack([...undoStack, editorContent]);
    setEditorContent(newContent);
    setRedoStack([]);
  };

  return (
    <div className="text-editor">
      <div className="toolbar">
        <select
          value={selectedBlock}
          onChange={(e) => changeBlockType(e.target.value)}
          style={{
            padding: "10px 15px",
            margin: "5px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "#282c34",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
        </select>

        <select
          value={fontSize}
          onChange={(e) => changeFontSize(e.target.value)}
          style={{
            padding: "10px 15px",
            margin: "5px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "#282c34",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="28px">28</option>
          <option value="32px">32</option>
        </select>

        <EditorButton
          onClick={() => toggleStyle("b")}
          icon={icons.bold}
          isActive={activeCommands.includes("b")}
          title="Bold"
        />
        <EditorButton
          onClick={() => toggleStyle("i")}
          icon={icons.italic}
          isActive={activeCommands.includes("i")}
          title="Italic"
        />
        <EditorButton
          onClick={() => toggleStyle("u")}
          icon={icons.underline}
          isActive={activeCommands.includes("u")}
          title="Underline"
        />
        <EditorButton
          onClick={() => toggleStyle("strike")}
          icon={icons.strikethrough}
          isActive={activeCommands.includes("strike")}
          title="Strikethrough"
        />
        <EditorButton
          onClick={() => toggleList("ul")}
          icon={icons.unorderedlist}
          isActive={activeCommands.includes("ul")}
          title="Unordered List"
        />
        <EditorButton
          onClick={() => toggleList("ol")}
          icon={icons.orderedlist}
          isActive={activeCommands.includes("ol")}
          title="Ordered List"
        />
        <EditorButton
          onClick={() => justifyText("left")}
          icon={icons.alignLeft}
          isActive={activeCommands.includes("justifyLeft")}
          title="Align Left"
        />
        <EditorButton
          onClick={() => justifyText("center")}
          icon={icons.alightCenter}
          isActive={activeCommands.includes("justifyCenter")}
          title="Align Center"
        />
        <EditorButton
          onClick={() => justifyText("right")}
          icon={icons.alignRight}
          isActive={activeCommands.includes("justifyRight")}
          title="Align Right"
        />
        <EditorButton
          onClick={() => justifyText("justify")}
          icon={icons.alignJustify}
          isActive={activeCommands.includes("justify")}
          title="Justify"
        />
        <EditorButton
          onClick={createLink}
          icon={icons.link}
          isActive={activeCommands.includes("a")}
          title="Insert Link"
        />
        <EditorButton
          onClick={unlink}
          icon={icons.unlink}
          isActive={false} // Unlink is never active initially
          title="Remove Link"
        />
        <EditorButton
          onClick={undo}
          icon={icons.undo}
          isActive={false} // Undo is never active initially
          title="Undo"
        />
        <EditorButton
          onClick={redo}
          icon={icons.redo}
          isActive={false} // Redo is never active initially
          title="Redo"
        />

        <EditorButton
          onClick={handleImageUpload}
          icon={icons.imageUpload}
          isActive={false}
          title="Insert Image"
        />
      </div>
      <ContentEditable
        id="editor"
        innerRef={divRef}
        html={editorContent}
        disabled={false}
        onChange={handleChange}
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          minHeight: "100px",
        }}
      />
    </div>
  );
};

export default TextEditor;
