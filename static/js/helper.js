"use strict";

function require(value, message) {
  if (value === null || value === undefined)
    throw new Error(message);

  return value;
}
