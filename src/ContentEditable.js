import React from 'react';
import deepEqual from 'fast-deep-equal';
import PropTypes from 'prop-types';

function normalizeHtml(str) {
  return str && str.replace(/&nbsp;|\u202F|\u00A0/g, ' ').replace(/<br \/>/g, '<br>');
}

function replaceCaret(el) {
  const target = document.createTextNode('');
  el.appendChild(target);
  const isTargetFocused = document.activeElement === el;
  if (target !== null && target.nodeValue !== null && isTargetFocused) {
    const sel = window.getSelection();
    if (sel !== null) {
      const range = document.createRange();
      range.setStart(target, target.nodeValue.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    if (el instanceof HTMLElement) el.focus();
  }
}

export default class ContentEditable extends React.Component {
  constructor(props) {
    super(props);
    this.lastHtml = this.props.html;
    this.el = typeof this.props.innerRef === 'function' ? { current: null } : React.createRef();
  }

  getEl = () => (this.props.innerRef && typeof this.props.innerRef !== 'function' ? this.props.innerRef : this.el).current;

  render() {
    const { tagName, html, innerRef, allowHtml, ...props } = this.props;

    return React.createElement(
      tagName || 'div',
      {
        ...props,
        ref: typeof innerRef === 'function' ? (current) => {
          innerRef(current);
          this.el.current = current;
        } : innerRef || this.el,
        onInput: this.emitChange,
        onBlur: this.props.onBlur || this.emitChange,
        onKeyUp: this.props.onKeyUp || this.emitChange,
        onKeyDown: this.props.onKeyDown || this.emitChange,
        contentEditable: !this.props.disabled,
        dangerouslySetInnerHTML: { __html: allowHtml ? html : this.escapeHtml(html) }
      },
      this.props.children);
  }

  escapeHtml(html) {
    const div = document.createElement('div');
    div.innerText = html;
    return div.innerHTML;
  }

  shouldComponentUpdate(nextProps) {
    const { props } = this;
    const el = this.getEl();

    if (!el) return true;

    if (normalizeHtml(nextProps.html) !== normalizeHtml(el.innerHTML)) {
      return true;
    }

    return props.disabled !== nextProps.disabled ||
      props.tagName !== nextProps.tagName ||
      props.className !== nextProps.className ||
      props.innerRef !== nextProps.innerRef ||
      props.placeholder !== nextProps.placeholder ||
      !deepEqual(props.style, nextProps.style) ||
      props.allowHtml !== nextProps.allowHtml;
  }

  componentDidUpdate() {
    const el = this.getEl();
    if (!el) return;

    if (this.props.html !== el.innerHTML) {
      el.innerHTML = this.props.html;
    }
    this.lastHtml = this.props.html;
    replaceCaret(el);
  }

  emitChange = (originalEvt) => {
    const el = this.getEl();
    if (!el) return;

    const html = el.innerHTML;
    if (this.props.onChange && html !== this.lastHtml) {
      const evt = Object.assign({}, originalEvt, {
        target: {
          value: html
        }
      });
      this.props.onChange(evt);
    }
    this.lastHtml = html;
  }

  static propTypes = {
    html: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    tagName: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    innerRef: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.func,
    ]),
    allowHtml: PropTypes.bool
  }
}