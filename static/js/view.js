"use strict";

class View {
  constructor(...args) {
    this.init(...args);

    /**
     * @type {Element}
     */
    this.$root = this.render();
    this.$root.__view = this;
  }

  /**
   * Implement this method in a subclass. The arguments that were
   * passed to the constructor will be forwarded to this method.
   */
  init() {
  }

  /**
   * Build the ui and return an element
   * @returns {Element}
   */
  render() {
    return document.createElement("div");
  }

  /**
   * Appends this view to the given target. A view can only be appended once.
   * @param {Element} target The target to append to.
   */
  appendTo(target) {
    target.appendChild(this.$root);
  }

  /**
   * Changes the position of this node.
   */
  moveTo(pos) {
    const target = Vector.of(pos);
    this.$root.style.left = target.x + "px";
    this.$root.style.top = target.y + "px";
  }

  /**
   * Returns the position of this view.
   * @returns {Vector}
   */
  get position() {
    return new Vector(
      parseFloat(this.$root.style.left || 0),
      parseFloat(this.$root.style.top || 0));
  }

  /**
   * The width of this element.
   * @returns {Number}
   */
  get width() {
    return this.$root.offsetWidth;
  }

  /**
   * The height of this element.
   * @returns {Number}
   */
  get height() {
    return this.$root.offsetHeight;
  }

  get size() {
    const rect = this.$root.getBoundingClientRect();
    return new Vector(rect.width, rect.height);
  }

  /**
   * Gets the associated view for some element
   *
   * @param {Element} element
   * @returns {View}
   */
  static of(element) {
    const result = element.__view;
    if (result === null || result === undefined)
      throw new Error("No view on this element");

    return result;
  }
}
