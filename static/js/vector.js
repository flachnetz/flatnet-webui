"use strict";

class Vector {
  /**
   *A simple vector class.
   *
   * @param {number} x first coordinate of this vector
   * @param {number} y second coordinate of this vector
   */
  constructor(x = 0, y = 0) {
    if (typeof x !== "number" || typeof y !== "number") {
      throw new Error("Invalid argument types");
    }

    /**
     * The x coordinate of this vector
     * @type {number}
     */
    this.x = x;

    /**
     * The y coordinate of this vector.
     * @type {number}
     */
    this.y = y;
  }

  /**
   * Adds two vectors.
   *
   * @param other Vector The other vector
   * @returns {Vector}
   */
  plus(other) {
    return new Vector(this.x + other.x, this.y + other.y);
  }

  minus(other) {
    return new Vector(this.x - other.x, this.y - other.y);
  }

  dot(other) {
    return this.x * other.x + this.y * other.y;
  }

  scaled(factor) {
    return new Vector(this.x * factor, this.y * factor);
  }

  distanceTo(other) {
    return this.minus(other).norm;
  }

  /**
   * Returns the angle between the two vectors in radians.
   */
  angleTo(other) {
    return Math.atan2(other.y - this.y, other.x - this.x);
  }

  get norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  get normSq() {
    return this.x * this.x + this.y * this.y;
  }

  get normalized() {
    return this.scaled(1 / this.norm);
  }

  /**
   * Alias for "x"
   * @returns {number}
   */
  get width() {
    return this.x;
  }

  /**
   * Alias for "x"
   * @returns {number}
   */
  get left() {
    return this.x;
  }

  /**
   * Alias for "y"
   * @returns {number}
   */
  get height() {
    return this.y;
  }

  /**
   * Alias for "y"
   * @returns {number}
   */
  get top() {
    return this.y;
  }

  get abs() {
    return new Vector(Math.abs(this.x), Math.abs(this.y));
  }

  static origin() {
    return new Vector();
  }

  static random() {
    return Vector.polar(Math.random() * 2 * Math.PI, 1);
  }

  static polar(angle, radius = 1) {
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return new Vector(x, y);
  }

  /**
   * Tries to convert the given arguments to a vector.
   * @returns {Vector}
   */
  static of(obj, second) {
    if (obj instanceof Vector)
      return obj;

    const x = obj.x !== undefined ? obj.x
      : obj.left !== undefined ? obj.left
      : typeof obj === "number" ? obj
      : obj[0];

    const y = obj.y !== undefined ? obj.y
      : obj.top !== undefined ? obj.top
      : second !== undefined ? second
      : obj[1];

    if (x === undefined || y === undefined)
      throw new TypeError("Could not convert to vector", obj);

    return new Vector(x, y);
  }
}
