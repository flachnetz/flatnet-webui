
/**
 * Helper class to save and restore the position of nodes
 */
class StateStore {
  constructor(graphId, state = {}) {
    this.graphId = graphId;
    this.state = state;

    // initialize "format"
    this.state.positions = this.state.positions || {};
  }

  persist() {
    StateStore._persist(this.graphId, this.state);
  }

  /**
   * Returns the position of the given node as a {Vector} or
   * stores the provided position. If no position is known, this method
   * returns undefined.
   * @returns {Vector, undefined}
   */
  positionOf(nodeId, newValue) {
    if (!newValue) {
      const pos = this.state.positions[nodeId];
      return pos ? Vector.of(pos) : undefined;
    } else {
      const pos = Vector.of(newValue);
      this.state.positions[nodeId] = [pos.x, pos.y];
    }
  }

  static _load(graphId) {
    const serialized = localStorage.getItem(`graph.states.${graphId}`) || "{}";
    return JSON.parse(serialized);
  }

  static _persist(graphId, state) {
    const serialized = JSON.stringify(state);
    localStorage.setItem(`graph.states.${graphId}`, serialized);
  }

  static restore(graphId) {
    return new StateStore(graphId, this._load(graphId));
  }
}
