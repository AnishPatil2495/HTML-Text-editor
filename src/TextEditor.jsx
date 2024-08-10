import React, { useState, useEffect, useRef } from "react";
import "./TextEditor.css";
import { EditorButton } from "./components/button/button";
import { icons } from "./assets";
import ContentEditable from "./ContentEditable";
import DOMPurify from "dompurify";

const CodeView = ({ content, onChange }) => {
  return (
    <textarea
      value={content}
      onChange={(e) => onChange(e)}
      style={{
        width: "100%",
        height: "400px",
        padding: "10px",
        border: "1px solid #ccc",
        fontFamily: "monospace",
        fontSize: "14px",
        backgroundColor: "#2d2d2d",
        color: "#ffffff",
        lineHeight: "1.5",
        whiteSpace: "pre",
        overflow: "auto",
        caretColor: "#ffffff",
        outline: "none",
        resize: "none",
        borderRadius: "4px",
      }}
    />
  );
};

const decodeHtml = (html) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const TextEditor = () => {
  const divRef = useRef(null);
  const [activeCommands, setActiveCommands] = useState([]);
  const [editorContent, setEditorContent] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("p");
  const [fontSize, setFontSize] = useState("24px");
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [codeView, setCodeView] = useState(false);

  // const applyStyle = (tag, style = {}) => {
  //   const selection = window.getSelection();
  //   if (!selection.rangeCount) return;

  //   const range = selection.getRangeAt(0);
  //   const selectedText = range.extractContents();
  //   const span = document.createElement(tag);

  //   Object.keys(style).forEach((key) => {
  //     span.style[key] = style[key];
  //   });

  //   span.appendChild(selectedText);
  //   range.insertNode(span);
  //   setEditorContent(document.getElementById("editor").innerHTML);
  //   window.getSelection().removeAllRanges();
  // };

  const applyStyle = (tag, style = {}) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.extractContents();

    // Create a temporary container to hold the selected content
    const tempDiv = document.createElement("div");
    tempDiv.appendChild(selectedText);

    // Function to remove all occurrences of a specific tag recursively
    const removeTagRecursively = (element, tagName) => {
      const children = element.querySelectorAll(tagName);
      children.forEach((child) => {
        while (child.firstChild) {
          child.parentNode.insertBefore(child.firstChild, child);
        }
        child.parentNode.removeChild(child);
      });
    };

    // Check if the content is already wrapped with the tag
    const isWrapped =
      tempDiv.firstChild && tempDiv.firstChild.tagName === tag.toUpperCase();

    if (isWrapped) {
      // If the content is already wrapped, remove all instances of the tag
      removeTagRecursively(tempDiv, tag.toLowerCase());
    } else {
      // If not wrapped, create the wrapping tag and apply styles
      const span = document.createElement(tag);
      Object.keys(style).forEach((key) => {
        span.style[key] = style[key];
      });
      span.innerHTML = tempDiv.innerHTML;
      tempDiv.innerHTML = "";
      tempDiv.appendChild(span);
    }

    // Re-insert the processed content
    range.insertNode(tempDiv.firstChild);
    setEditorContent(document.getElementById("editor").innerHTML);
    window.getSelection().removeAllRanges();
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

    if (parent.tagName === tag.toUpperCase()) {
      const text = document.createTextNode(parent.innerText);
      parent.parentNode.replaceChild(text, parent);
      setEditorContent(document.getElementById("editor").innerHTML);
      window.getSelection().removeAllRanges();
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
    console.log("Toggle", tag, parent.tagName);
    if (parent.tagName === tag.toUpperCase()) {
      console.log("Toggle list remove style called");
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
    console.log("Justify text reset called outside", parent, selection);

    if (isActive) {
      // If the alignment is active, toggle it off by resetting the text alignment
      console.log("Justify text reset called", parent, selection);
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
    let parent = selection.anchorNode.parentNode;

    // Check if the current parent is a block element (e.g., P, H1, H2, etc.)
    if (["P", "H1", "H2", "H3", "H4", "H5", "H6"].includes(parent.tagName)) {
      // Replace the existing block element with the new block type
      const newBlock = document.createElement(blockType);

      // Move all children from the old block to the new block
      while (parent.firstChild) {
        newBlock.appendChild(parent.firstChild);
      }

      // Replace the old block with the new block
      parent.parentNode.replaceChild(newBlock, parent);
      parent = newBlock; // Update the parent reference to the new block
    } else {
      // If the parent is not a block element, create a new block and insert it
      const newBlock = document.createElement(blockType);
      newBlock.appendChild(range.extractContents());
      range.insertNode(newBlock);
      parent = newBlock;
    }

    // Adjust the selection to include the new block
    const newRange = document.createRange();
    newRange.selectNodeContents(parent);
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

  const applyFontToSelection = (fontFamily) => {
    setFontFamily(fontFamily);
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Create a new document fragment to wrap the selected content
    const fragment = range.cloneContents();
    const wrapper = document.createElement("span");
    wrapper.style.fontFamily = fontFamily;

    // Append the cloned content to the new wrapper
    wrapper.appendChild(fragment);

    // Remove the old content
    range.deleteContents();

    // Insert the new wrapper with the new font
    range.insertNode(wrapper);

    // Apply the font to all descendant elements of the wrapper
    const applyFontToDescendants = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.style.fontFamily = fontFamily;
        node.childNodes.forEach(applyFontToDescendants);
      }
    };

    applyFontToDescendants(wrapper);

    // Remove selection
    selection.removeAllRanges();

    // Update the state with the new content
    setEditorContent(divRef.current.innerHTML);
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

  const applyInlineStyles = (styleTag, body) => {
    const styleSheet = styleTag.sheet;
    const rules = styleSheet.cssRules;
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const elements = body.querySelectorAll(rule.selectorText);
      elements.forEach((element) => {
        for (let j = 0; j < rule.style.length; j++) {
          const property = rule.style[j];
          element.style[property] = rule.style.getPropertyValue(property);
        }
      });
    }
  };

  const transformHtml = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(DOMPurify.sanitize(html), "text/html");

    // Apply inline styles from <style> tags
    const styleTags = doc.querySelectorAll("style");
    styleTags.forEach((styleTag) => {
      applyInlineStyles(styleTag, doc.body);
      styleTag.remove();
    });

    // Wrap tables and images in figure tags
    const tables = doc.querySelectorAll("table");
    tables.forEach((table) => {
      const figure = doc.createElement("figure");
      figure.classList.add("table");
      table.parentNode.replaceChild(figure, table);
      figure.appendChild(table);
    });

    const images = doc.querySelectorAll("img");
    images.forEach((image) => {
      const figure = doc.createElement("figure");
      figure.classList.add("image");
      image.parentNode.replaceChild(figure, image);
      figure.appendChild(image);
    });

    return doc.body.innerHTML;
  };

  const toggleCodeView = () => {
    setCodeView((prevCodeView) => {
      let sanitizedContent = editorContent;
      if (prevCodeView) {
        sanitizedContent = transformHtml(editorContent);
      }
      setEditorContent(sanitizedContent);
      return !prevCodeView;
    });
  };

  const handleChange = (e) => {
    // replaceCaret(e.target);
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
    if (divRef.current && !codeView) {
      divRef.current.focus();
      divRef.current.blur();
    }
  }, [codeView]);

  function replaceCaret(el) {
    // Place the caret at the end of the element
    var target = document.createTextNode("");
    el.appendChild(target);
    // do not move caret if element was not focused
    var isTargetFocused = document.activeElement === el;
    if (target !== null && target.nodeValue !== null && isTargetFocused) {
      var sel = window.getSelection();
      if (sel !== null) {
        var range = document.createRange();
        range.setStart(target, target.nodeValue.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      if (el instanceof HTMLElement) el.focus();
    }
  }

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

        <select
          value={fontFamily}
          onChange={(e) => applyFontToSelection(e.target.value)}
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
          <option value="Roboto">Roboto</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="verdana">verdana</option>
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
        <EditorButton
          onClick={toggleCodeView}
          icon={icons.code}
          isActive={codeView}
        />
      </div>
      {codeView ? (
        <CodeView content={editorContent} onChange={handleChange} />
      ) : (
        <ContentEditable
          id="editor"
          innerRef={divRef}
          html={decodeHtml(editorContent)}
          disabled={false}
          onChange={(e) => handleChange(e)}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            minHeight: "100px",
          }}
        />
      )}
    </div>
  );
};

export default TextEditor;
