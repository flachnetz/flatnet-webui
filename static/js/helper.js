"use strict";

function require(value, message) {
  if (value === null || value === undefined)
    throw new Error(message);

  return value;
}

function rxDebug() {
  return Rx.Observer.create(
    (value) => console.log("on next: ", value),
    (error) => console.log("on error", error),
    () => console.log("on complete"));
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
