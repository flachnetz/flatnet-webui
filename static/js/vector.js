class Vector {
  constructor(x = 0, y = 0) {
    if (typeof x !== "number" || typeof y !== "number") {
      throw new Error("Invalid argument types");
    }

    this.x = x;
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

  get sqNorm() {
    return this.x * this.x + this.y * this.y;
  }

  get normalized() {
    return this.scaled(1 / this.norm);
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
