"use strict";

function require(value, message) {
  if (value === null || value === undefined)
    throw new Error(message);

  return value;
}

jQuery.fn.extend({
  dom: function() {
    return this[0];
  }
});
