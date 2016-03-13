"use strict";

class Rect {
  constructor(position, size) {
    this.position = Vector.of(position);
    this.size = Vector.of(size);
  }

  get x() {
    return this.position.x;
  }

  get y() {
    return this.position.y;
  }

  get width() {
    return this.size.x;
  }

  get height() {
    return this.size.y;
  }

  get right() {
    return this.position.x + this.size.x;
  }

  get bottom() {
    return this.position.y + this.size.y;
  }

  get center() {
    return this.position.plus(this.size.scaled(0.5));
  }

  contains(pos) {
    const point = Vector.of(pos);
    return this.x <= point.x && point.x <= this.right
      && this.y <= point.y && point.y <= this.bottom;
  }

  intersectsCircle(center, radius) {
    const distance = center.minus(this.center).abs;
    
    const halfSize = this.size.scaled(0.5);
    if (distance.x > halfSize.x + radius || distance.y > halfSize.y + radius)
      return false;

    if (distance.x <= halfSize.x || distance.y <= halfSize.y)
      return true;

    return distance.minus(halfSize).normSq <= radius * radius;
  }

  static bboxOf(first, second) {
    const pos = new Vector(Math.min(first.x, second.x), Math.min(first.y, second.y));
    const size = new Vector(Math.max(first.x, second.x), Math.max(first.y, second.y)).minus(pos);
    return new Rect(pos, size);
  }

  static empty(pos = new Vector()) {
    return new Rect(pos, new Vector(0, 0));
  }
}
