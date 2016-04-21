"use strict";

class Mapping {
  constructor(pattern, target) {
    this.pattern = pattern;
    this.target = target;
  }

  matches(id) {
    return this.pattern.test(id)
  }
}

class GroupMapper {
  /**
   * Creates a new group.
   * @param {Array<Mapping>} mappings
   */
  constructor(mappings = []) {
    this.mappings = mappings;
  }

  /**
   * Adds a new mapping
   * @param {Mapping} mapping The mapping to add.
   */
  pushMapping(mapping) {
    this.mappings.push(mapping);
  }

  newMapping(pattern, target) {
    const mapping = new Mapping(pattern, target);
    this.pushMapping(mapping);
    return mapping;
  }

  /**
   * Applies the mappings to the given id and returns the resulting one.
   * @param {String} id The id to map
   * @returns {String}
   */
  map(id) {
    for (let i = 0; i < this.mappings.length; i++) {
      var mapping = this.mappings[i];
      if (mapping.matches(id)) {
        id = mapping.target;
      }
    }

    return id;
  }

  /**
   * Removes the mapping that maps to the given id.
   * @param target The target id.
   * @returns {Mapping[]}
     */
  remove(target) {
    const mappings = [];

    this.mappings = this.mappings.filter(mapping => {
      if (mapping.target === target) {
        mappings.push(mapping);
        return false;
      } else {
        return true;
      }
    });
    
    return mappings;
  }
}
