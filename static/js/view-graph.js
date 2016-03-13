"use strict";

(() => {
  /**
   * Gets the edge css-class name for the given node ids.
   * @param {String} first  the node id of the source node
   * @param {String} second the node id of the target node
   * @private
   */
  function _edgeClass(first, second) {
    return `__e${first}--${second}`;
  };

  /**
   * Gets the node css-class name for the given node id.
   * @param {String} id the node id
   * @private
   */
  function  _nodeClass(id) {
    return `__n${id}`;
  }


  class GraphNodeView extends View {
    init(id) {
      this._id = id;
      this._position = new Rx.BehaviorSubject();
      this._size = undefined;
    }

    render() {
      const el = createElement("div", "graph__node");
      el.innerText = this.id;
      return el;
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
     * Returns the position of this node.
     * @returns {Vector}
     */
    get position() {
      return super.position.plus(this.size.scaled(0.5));
    }

    get width() {
      return this.size.x;
    }

    get height() {
      return this.size.y;
    }

    get size() {
      return this._size !== undefined
        ? this._size
        : this._size = super.size;
    }

    get alias() {
      return this.$root.innerText;
    }

    set alias(alias) {
      this.$root.innerText = alias;
    }

    get selected() {
      return this.$root.classList.contains("graph__node--selected");
    }

    set selected(selected) {
      if (selected) {
        this.$root.classList.add("graph__node--selected");
      } else {
        this.$root.classList.remove("graph__node--selected");
      }
    }

    /**
     * Changes the position of this node. This will trigger a change in
     * the position observable.
     */
    moveTo(pos) {
      const center = Vector.of(pos);
      super.moveTo(center.minus(this.size.scaled(0.5)));
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
      const view = createElement("div", "graph__edge");
      this._source.combineLatest(this._target).subscribe(args => {
        const [source, target] = args;
        const angle = source.angleTo(target);
        const length = source.distanceTo(target);

        const st = view.style;
        st.top = `${source.y}px`;
        st.left = `${source.x}px`;
        st.width = `${length}px`;
        st.transform = `rotate(${angle}rad)`;
      });

      return view;
    }

    ping(reversed = false, duration = 2000) {
      const $packet = createElement("div",
        "graph__edge__packet",
        `graph__edge__packet--${reversed ? 'reverse' : 'normal'}`);

      $packet.style.transitionDuration = `${duration}ms`;
      this.$root.appendChild($packet);

      // set the class after layout and rendering
      Rx.Observable.timer(100)
        .doOnNext(() => $packet.classList.add("graph__edge__packet--on"))
        .delay(100 + duration)
        .subscribe(() => $packet.parentNode.removeChild($packet));
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
      const $outer = createElement("div", "graph");
      this.$edges = createChildOf($outer, "div", "graph__edges");
      this.$nodes = createChildOf($outer, "div", "graph__nodes");

      this.$selection = createChildOf($outer, "div", "graph__selection");
      this.$selection.style.display = "none";

      Rx.DOM.mousedown($outer)
        .filter(event => event.button === 0 && event.target.classList.contains("graph__node--selected"))
        .flatMap(event => Rx.DOM.mousemove($outer)

          // stop on mouse up
          .takeUntil(Rx.Observable.merge(Rx.DOM.mouseup($outer)))

          // convert to delta vector
          .map(event => new Vector(event.movementX, event.movementY))

          // and move the graph using this vector.
          .withLatestFrom(this.rxSelection))

        .subscribe(([delta, nodes]) => this.moveNodesBy(delta, nodes));

      this.rxSelection = Rx.DOM.mousedown($outer)
        // only start on not-selected nodes
        .filter(event => event.button === 0 && (event.target.matches(":not(.graph__node), .graph__node:not(.graph__node--selected)")))

        .flatMap(down => Rx.DOM.mousemove($outer)

          // stop on mouse up
          .takeUntil(Rx.Observable.merge(
            Rx.DOM.mouseup($outer),
            Rx.DOM.mouseleave($outer)))

          // calculate bounding box from "start" and "current" coordinate.
          .map(event => Rect.bboxOf(
            new Vector(down.clientX, down.clientY),
            new Vector(event.clientX, event.clientY)))

          // start with an empty bounding box
          .startWith(Rect.empty(new Vector(down.clientX, down.clientY)))

          // reflect state in view
          .doOnNext(bbox => {
            const st = this.$selection.style;
            st.display = "block";
            st.top = bbox.y + "px";
            st.left = bbox.x + "px";
            st.width = bbox.width + "px";
            st.height = bbox.height + "px";
          })

          .map(bbox => this.applySelection(bbox))

          // hide at the end
          .finally(() => this.$selection.style.display = "none")

          // only get the last selection
          .last({defaultValue: []}))

        // start with an empty selection
        .publishValue([]);

      // eagerly connect
      this.rxSelection.connect();

      return $outer;
    }

    /**
     * @param {Rect} bbox The bounding box for the selection
     * @returns {Array<GraphNodeView>}
     */
    applySelection(bbox) {
      function selectionTest(node) {
        return bbox.intersectsCircle(node.position, node.radius);
      }

      return this.nodes.map(node => {
        if (selectionTest(node)) {
          node.selected = true;
          return node;
        } else {
          node.selected = false;
        }
      }).filter(node => node);
    }

    /**
     * Moves nodes by the given delta. If the list of nodes is empty,
     * all nodes will be moved.
     * @param {Vector} delta
     * @param {Array.<GraphNodeView>} nodes The nodes shall be moved
     */
    moveNodesBy(delta, nodes = []) {
      (nodes.length ? nodes : this.nodes)
        .map(node => [node, node.position.plus(delta)])
        .forEach(([node, pos]) => {
          node.moveTo(pos);
        });
    }

    connect(firstId, secondId) {
      const first = this.nodeOf(firstId);
      const second = this.nodeOf(secondId);

      const edge = new GraphEdgeView(first.positionObservable, second.positionObservable);
      edge.$root.classList.add(_edgeClass(first.id, second.id));
      edge.appendTo(this.$edges);
      return edge;
    }

    /**
     * Gets the default position for a node
     * @param {GraphNodeView} node The node to get the default position for.
     * @returns {Vector}
     * @private
     */
    _defaultNodePosition(node) {
      return this.stateStore.positionOf(node.id)
        || new Vector(this.width / 2, this.height / 2).plus(Vector.random().scaled(50 + 100 * Math.random()));
    }

    /**
     * Adds the given node to the graph view.
     * @param {GraphNodeView} node
     * @param {Vector|*} position
     */
    addNode(node, position = this._defaultNodePosition(node)) {
      node.$root.classList.add(_nodeClass(node.id));
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
      const forward = this.$edges.querySelector(":scope > ." + _edgeClass(sourceId, targetId));
      if (forward) {
        return [View.of(forward), false];

      } else {
        const reverse = this.$edges.querySelector(":scope > ." + _edgeClass(targetId, sourceId));
        if (reverse) {
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

      const nodes = this.$nodes.querySelector("." + _nodeClass(nodeId));
      return nodes ? View.of(nodes) : null;
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
      return Array.from(this.$nodes.childNodes).map(View.of);
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
        return pos !== undefined ? Vector.of(pos) : undefined;
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

  window.GraphView = GraphView;
  window.StateStore = StateStore;
})();
