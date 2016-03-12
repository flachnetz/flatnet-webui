"use strict";

class View {
  constructor(...args) {
    this.init(...args);

    this.$root = jQuery(this.render());
    if (this.$root.length !== 1)
      throw new Error("render() must return exactly one element");

    this.$root.data("__view", this);
    this.root = this.$root[0];
  }

  /**
   * Implement this method in a subclass. The arguments that were
   * passed to the constructor will be forwarded to this method.
   */
  init() {
  }

  /**
   * Build the ui and return a jQuery object.
   * @returns {jQuery}
   */
  render() {
    return jQuery("<div>");
  }

  /**
   * Appends this view to the given target. A view can only be appended once.
   * @param target The target to append to. Can be anything that is accepted by
   * the jQuery constructor.
   */
  appendTo(target) {
    if (this.$root.parent().length)
      throw new Error("View already attached");

    this.$root.appendTo(target);
  }

  /**
   * Changes the position of this node.
   */
  moveTo(pos) {
    const target = Vector.of(pos);
    this.root.style.left = target.x + "px";
    this.root.style.top = target.y + "px";
  }

  /**
   * Returns the position of this view.
   * @returns {Vector}
   */
  get position() {
    return new Vector(
      parseFloat(this.root.style.left || 0),
      parseFloat(this.root.style.top || 0));
  }

  /**
   * The width of this element.
   * @returns {Number}
   */
  get width() {
    return this.root.offsetWidth;
  }

  /**
   * The height of this element.
   * @returns {Number}
   */
  get height() {
    return this.root.offsetHeight;
  }

  get size() {
    const rect = this.root.getBoundingClientRect();
    return new Vector(rect.width, rect.height);
  }

  static of(el) {
    const result = jQuery(el).data("__view");
    if (result === null || result === undefined)
      throw new Error("No view on this element");

    return result;
  }
}
