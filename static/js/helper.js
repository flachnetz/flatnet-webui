"use strict";

function require(value, message) {
  if (value == null)
    throw new Error(message);

  return value;
}

function tap(tag = "") {
  return Rx.Observer.create(
    (value) => console.log(`on next (${tag}):`, value),
    (error) => console.log(`on error (${tag}):`, error),
    () => console.log(`on complete (${tag})`));
}

/**
 * Creates a new element with the given classes.
 * @returns {Element}
 */
function createElement(tag, ...classes) {
  const element = document.createElement(tag);
  element.classList.add(...classes);
  return element;
}

/**
 * Creates a new element as a child of another one
 * @param {Element} parent
 * @returns {Element}
 */
function createChildOf(parent, tag, ...classes) {
  const element = createElement(tag, ...classes);
  parent.appendChild(element);
  return element;
}

/**
 * Parses the given html string into an element.
 * @param {String} html
 * @returns {Element}
 */
function parseHtml(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  if (wrapper.childElementCount !== 1) {
    throw new Error("html should contain exactly one root element");
  }
  
  return wrapper.firstElementChild;
}

/**
 * Compares two arrays. Returns true, if the length of both
 * arrays equals and they contain the same elements in the same
 * order where each pair of elements is compared using "===".
 *
 * @param {Array} lhs The first array
 * @param {Array} rhs The second array
 * @returns {boolean}
 */
function arrayEquals(lhs, rhs) {
  return lhs === rhs || (rhs != null && lhs != null) && (
    lhs.length === rhs.length && lhs.every((val, idx) => val === rhs[idx]));
}

