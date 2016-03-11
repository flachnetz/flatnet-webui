"use strict";

function require(value, message) {
  if (value === null || value === undefined)
    throw new Error(message);

  return value;
}

class GraphNodeView extends View {
  init(id) {
    this._id = id;
    this._position = new Rx.BehaviorSubject();
  }

  render() {
    const view = jQuery(`<div class="graph__node">`).css({left: 0, top: 0});

    // the position of the node can be changed
    let width, height;
    view.draggable({
      start: (event, ui) => {
        width = this.$root.width();
        height = this.$root.height();
      },
      drag: (event, ui) => this._position.onNext({
        // add offset to return the center of the node
        x: ui.position.left + width / 2,
        y: ui.position.top + height / 2
      })
    });

    // .draggable sets the position to relative, that's not what i want :/
    return view.css({position: "absolute"});
  }

  /**
   * The id of this node.
   * @returns {String}
   */
  get id() {
    return this._id;
  }

  /**
   * Returns an observable with the current position of this node.
   * @returns {Rx.Observable<Vector>}
   */
  get positionObservable() {
    return this._position.filter(pos => pos !== undefined).map(Vector.of);
  }

  /**
   * Get the radius by using half of the maximum of height and width.
   * @returns {number}
   */
  get radius() {
    return Math.max(this.width, this.height) / 2;
  }

  /**
   * Changes the position of this node. This will trigger a change in
   * the position observable.
   */
  moveTo(pos) {
    const width = this.$root.width();
    const height = this.$root.height();

    const center = Vector.of(pos);
    this.$root.css({left: center.x - width / 2, top: center.y - height / 2});
    this._position.onNext(center);
  }
}

class GraphEdgeView extends View {
  /**
   * Connects two positions
   *
   * @param {Rx.Observable} source
   * @param {Rx.Observable} target
   */
  init(source, target) {
    this._source = source.map(Vector.of);
    this._target = target.map(Vector.of);
  }

  render() {
    const view = jQuery(`<div class="graph__edge">`);
    this._source.combineLatest(this._target).subscribe(args => {
      const [source, target] = args;
      const angle = source.angleTo(target);

      view.css({
        top: source.y,
        left: source.x,
        width: source.distanceTo(target),
        transform: `rotate(${angle}rad)`
      });
    });

    return view;
  }

  ping(reversed = false, duration = 2000) {
    const markup = `<div
      class="graph__edge__packet graph__edge__packet--${reversed ? 'reverse' : 'normal'}"
      style="transition-duration:${duration}ms"></div>`;

    const $packet = jQuery(markup).appendTo(this.$root);

    // set the class after layout and rendering
    Rx.Observable.just($packet)
      .delay(100)
      .doOnNext(() => $packet.addClass("graph__edge__packet--on"))
      .delay(100 + duration)
      .subscribe(() => $packet.remove());
  }
}

class GraphView extends View {
  /**
   * Initializes a new graph view.
   *
   * @param {StateStore} stateStore The state store to use for this graph
   */
  init(stateStore) {
    this.stateStore = require(stateStore, "state store must be non-null");
  }

  render() {
    const outer = jQuery(`<div class="graph">`);
    this.$edges = jQuery(`<div class="graph__edges">`).appendTo(outer);
    this.$nodes = jQuery(`<div class="graph__nodes">`).appendTo(outer);
    return outer;
  }

  connect(firstId, secondId) {
    const first = this.nodeOf(firstId);
    const second = this.nodeOf(secondId);

    const edge = new GraphEdgeView(first.positionObservable, second.positionObservable);
    edge.$root.addClass(GraphView._edgeClass(first.id, second.id));
    edge.appendTo(this.$edges);
    return edge;
  }

  /**
   * Gets the edge css-class name for the given node ids.
   * @param {String} first  the node id of the source node
   * @param {String} second the node id of the target node
   * @private
   */
  static _edgeClass(first, second) {
    return `__edge--${first}--${second}`;
  };

  /**
   * Gets the node css-class name for the given node id.
   * @param {String} id the node id
   * @private
   */
  static _nodeClass(id) {
    return `__node--${id}`;
  }

  addNode(node, position = this.stateStore.positionOf(node.id)) {
    node.$root.addClass(GraphView._nodeClass(node.id));
    node.appendTo(this.$nodes);

    // maybe move node to the stored position
    if (position !== undefined) {
      node.moveTo(position);
    }

    // sync the position back to the store
    node.positionObservable.debounce(100).subscribe(pos => {
      this.stateStore.positionOf(node.id, pos);
      this.stateStore.persist();
    });
  }

  /**
   * Looks for the edge
   * @param {String} sourceId The id of the source node
   * @param {String} targetId The id of the target node
   * @returns {Array<GraphEdgeView, Boolean>}
   */
  edgeOf(sourceId, targetId) {
    const forward = this.$edges.children("." + GraphView._edgeClass(sourceId, targetId));
    if (forward.length) {
      return [View.of(forward), false];

    } else {
      const reverse = this.$edges.children("." + GraphView._edgeClass(targetId, sourceId));
      if (reverse.length) {
        return [View.of(reverse), true];
      }
    }

    return [null, false];
  }

  nodeOf(nodeId) {
    if (nodeId instanceof GraphNodeView)
      return nodeId;

    if (nodeId === undefined || nodeId === null)
      return null;

    const nodes = this.$nodes.children("." + GraphView._nodeClass(nodeId));
    return nodes.length ? View.of(nodes) : null;
  }

  getOrCreateNode(nodeId, nearNodeId) {
    const existingNode = this.nodeOf(nodeId);
    if (existingNode !== null)
      return existingNode;

    // generate a random position for the new node.
    const position = this.stateStore.positionOf(nodeId) || (() => {
        const nearNode = this.nodeOf(nearNodeId);
        if (nearNode !== null) {
          const offset = Vector.random().normalized.scaled(3 * nearNode.radius);
          return nearNode.position.plus(offset);
        }
      })();

    // ok, create a new node
    const node = new GraphNodeView(nodeId);
    this.addNode(node, position);

    return node;
  }

  getOrCreateEdge(sourceId, targetId) {
    const [edge, reversed] = this.edgeOf(sourceId, targetId);
    if (edge !== null)
      return [edge, reversed];

    const source = this.getOrCreateNode(sourceId);
    const target = this.getOrCreateNode(targetId, sourceId);
    return [this.connect(source, target), false];
  }

  get nodes() {
    return this.$nodes.children().toArray().map(View.of);
  }
}

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
    if (newValue === undefined) {
      const pos = this.state.positions[nodeId];
      return pos !== undefined && Vector.of(pos);
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

jQuery(() => {
  const graph = new GraphView(StateStore.restore("test"));
  graph.appendTo(jQuery("body"));

  const traffic = Rx.Observable.merge(
    Rx.Observable.interval(120).map(_ => ({
      source: `node-${5 + parseInt(Math.random() * 5)}`,
      target: `node-${parseInt(Math.random() * 2)}`
    })),
    Rx.Observable.interval(50).map(_ => ({
      source: `node-${parseInt(Math.random() * 2)}`,
      target: `node-${10 + parseInt(Math.random() * 4)}`
    })),
    Rx.Observable.interval(200).delay(500).map(_ => ({
      source: `node-${10 + parseInt(Math.random() * 2)}`,
      target: `node-${15 + parseInt(Math.random() * 2)}`
    })))
    .filter(item => item.source !== item.target);

  traffic.subscribe(ping => {
    // const [edge, reversed] = graph.edgeOf(ping.source, ping.target);

    const [edge, reversed] = graph.getOrCreateEdge(ping.source, ping.target);
    edge.ping(reversed);
  });
});
