import React, { useState, useEffect, useRef } from "react";
import "./TextEditor.css";
import { EditorButton } from "./components/button/button";
import { icons } from "./assets";
import ContentEditable from "./ContentEditable";
import DOMPurify from 'dompurify';

const TextEditor = () => {
  const divRef = useRef(null);
  const [activeCommands, setActiveCommands] = useState([]);
  const [editorContent, setEditorContent] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("p");
  const [fontSize, setFontSize] = useState("24px");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [codeView, setCodeView] = useState(false);

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
      return isActive ? prevCommands.filter((cmd) => cmd !== tag) : [...prevCommands, tag];
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
      return isActive ? prevCommands.filter((cmd) => cmd !== listType) : [...prevCommands, listType];
    });

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const parent = selection.anchorNode.parentNode;

    if (parent.tagName === listType) {
      const list = parent.parentNode;
      const fragment = document.createDocumentFragment();
      while (list.firstChild) {
        fragment.appendChild(list.firstChild);
      }
      list.parentNode.replaceChild(fragment, list);
    } else {
      const list = document.createElement(listType);
      const listItem = document.createElement("li");
      listItem.appendChild(range.extractContents());
      list.appendChild(listItem);
      range.insertNode(list);
    }
    setEditorContent(document.getElementById("editor").innerHTML);
  };

  const justifyText = (alignment) => {
    setActiveCommands((prevCommands) => {
      const isActive = prevCommands.includes(alignment);
      return isActive ? prevCommands.filter((cmd) => cmd !== alignment) : [...prevCommands, alignment];
    });

    toggleStyle("div", { textAlign: alignment });
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
      setActiveCommands((prevCommands) => prevCommands.filter((cmd) => cmd !== "a"));
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

    setActiveCommands((prevCommands) => {
      return [...new Set([...prevCommands, ...activeCmds])];
    });

    if (["P", "H1", "H2", "H3", "H4", "H5", "H6"].includes(tagName)) {
      setSelectedBlock((prevBlock) => {
        return prevBlock !== tagName.toLowerCase() ? tagName.toLowerCase() : prevBlock;
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

        const img = document.createElement("img");
        img.src = url;
        img.style.maxWidth = "100%";

        img.addEventListener("mousedown", (event) => {
          event.preventDefault();
        });

        const editor = divRef.current;

        if (editor) {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.collapse(false);
          } else {
            editor.appendChild(img);
          }

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


  const toggleCodeView = () => {
    setCodeView((prevCodeView) => {
      if (prevCodeView) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(DOMPurify.sanitize(editorContent), "text/html");
  
        const tables = doc.querySelectorAll('table');
        tables.forEach(table => {
          const figure = doc.createElement('figure');
          figure.classList.add('table');
          table.parentNode.replaceChild(figure, table);
          figure.appendChild(table);
        });
  
        const images = doc.querySelectorAll('img');
        images.forEach(image => {
          const figure = doc.createElement('figure');
          figure.classList.add('image');
          image.parentNode.replaceChild(figure, image);
          figure.appendChild(image);
        });
  
        setEditorContent(doc.body.innerHTML);
      } else {
        const editorHtml = divRef.current.innerHTML;
        setEditorContent(editorHtml);
      }
  
      return !prevCodeView;
    });
  };
  

  const handleChange = (e) => {
    const newContent = e.target.value;
  
    if (codeView) {
      setEditorContent(newContent);
    } else {
      setUndoStack([...undoStack, editorContent]);
      setEditorContent(newContent);
      setRedoStack([]);
    }
  };
  
  useEffect(() => {
    if (divRef.current) {
      divRef.current.focus();
    }
  }, [codeView]);

  console.log(codeView);
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
        />
        <EditorButton
          onClick={() => toggleStyle("i")}
          icon={icons.italic}
          isActive={activeCommands.includes("i")}
        />
        <EditorButton
          onClick={() => toggleStyle("u")}
          icon={icons.underline}
          isActive={activeCommands.includes("u")}
        />
        <EditorButton
          onClick={() => toggleStyle("strike")}
          icon={icons.strikethrough}
          isActive={activeCommands.includes("strike")}
        />
        <EditorButton
          onClick={() => toggleList("ul")}
          icon={icons.unorderedlist}
          isActive={activeCommands.includes("ul")}
        />
        <EditorButton
          onClick={() => toggleList("ol")}
          icon={icons.orderedlist}
          isActive={activeCommands.includes("ol")}
        />
        <EditorButton
          onClick={() => justifyText("left")}
          icon={icons.alignLeft}
          isActive={activeCommands.includes("justifyLeft")}
        />
        <EditorButton
          onClick={() => justifyText("center")}
          icon={icons.alightCenter}
          isActive={activeCommands.includes("justifyCenter")}
        />
        <EditorButton
          onClick={() => justifyText("right")}
          icon={icons.alignRight}
          isActive={activeCommands.includes("justifyRight")}
        />
        <EditorButton
          onClick={() => justifyText("justify")}
          icon={icons.alignJustify}
          isActive={activeCommands.includes("justify")}
        />
        <EditorButton
          onClick={createLink}
          icon={icons.link}
          isActive={activeCommands.includes("a")}
        />
        <EditorButton
          onClick={unlink}
          icon={icons.unlink}
          isActive={false}
        />
        <EditorButton
          onClick={undo}
          icon={icons.undo}
          isActive={false}
        />
        <EditorButton
          onClick={redo}
          icon={icons.redo}
          isActive={false}
        />
        <EditorButton
          onClick={toggleCodeView}
          icon={icons.code}
          isActive={codeView}
        />
        <EditorButton
          onClick={handleImageUpload}
          icon={icons.imageUpload}
          isActive={false}
        />
      </div>
      <ContentEditable
        id="editor"
        innerRef={divRef}
        html={codeView ? editorContent : decodeHtml(editorContent)}
        disabled={false}
        onChange={handleChange}
        allowHtml={codeView}
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          minHeight: "100px",
        }}
      />
    </div>
  );
};

const decodeHtml = (html) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

export default TextEditor;