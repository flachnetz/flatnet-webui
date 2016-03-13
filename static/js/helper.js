"use strict";

function require(value, message) {
  if (value === null || value === undefined)
    throw new Error(message);

  return value;
}

jQuery.fn.extend({
  dom: function () {
    return this[0];
  }
});

function rxDebug() {
  return Rx.Observer.create(
    (value) => console.log("on next: ", value),
    (error) => console.log("on error", error),
    () => console.log("on complete"));
}
