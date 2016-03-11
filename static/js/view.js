"use strict";

class View {
  constructor(...args) {
    this.init(...args);

    this.$root = this.render();
    this.$root.data("__view", this);
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
   * Returns the position of this view.
   * @returns {Vector}
   */
  get position() {
    return Vector.of(this.$root.position());
  }

  /**
   * The width of this element.
   * @returns {Number}
   */
  get width() {
    return this.$root.width();
  }

  /**
   * The height of this element.
   * @returns {Number}
   */
  get height() {
    return this.$root.height();
  }

  static of(el) {
    const result = jQuery(el).data("__view");
    if (result === null || result === undefined)
      throw new Error("No view on this element");

    return result;
  }
}
