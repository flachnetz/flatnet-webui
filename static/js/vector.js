class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

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

  static of(obj) {
    const x = obj.x || obj.left || obj[0];
    const y = obj.y || obj.top || obj[1];
    if (x === undefined || y === undefined)
      throw new TypeError("Could not convert to vector", obj);

    return new Vector(x, y);
  }
}
