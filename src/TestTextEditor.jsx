import React, { useRef, useState } from "react";
import ContentEditable from "./ContentEditable";

const EditableDiv = () => {
  const divRef = useRef(null);
  const [content, setContent] = useState({
    html: "<b>Hello World!</b>",
  });

  const handleInput = (e) => {
    if (divRef.current) {
      maintainCaretPosition(e);
      setContent(divRef.current.innerHTML);
    }
  };

  const maintainCaretPosition = (event) => {
    const caret = event.target.selectionStart;
    const element = event.target;
    window.requestAnimationFrame(() => {
      element.selectionStart = caret;
      element.selectionEnd = caret;
    });
  };

  const handleChange = (e) => {
    setContent({
      html: e.target.value,
    });
  };

  const applyFormat = (tag) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      const wrappedText = `<${tag}>${selectedText}</${tag}>`;
      const newHtml = content.html.replace(selectedText, wrappedText);
      setContent({
        html: newHtml,
      });
    }
  };

  return (
    <div>
      <button onClick={() => applyFormat("b")}>Bold</button>
      <button onClick={() => applyFormat("i")}>Bold</button>
      <ContentEditable
        innerRef={divRef}
        html={content.html}
        disabled={false}
        onChange={handleChange}
      />
    </div>
  );
};

export default EditableDiv;
