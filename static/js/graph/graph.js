"use strict";

const GraphView = (() => {
  /**
   * Gets the edge css-class name for the given node ids.
   * @param {String} first  the node id of the source node
   * @param {String} second the node id of the target node
   * @private
   */
  function _edgeClass(first, second) {
    return `__e${first}--${second}`;
  }

  /**
   * Gets the node css-class name for the given node id.
   * @param {String} id the node id
   * @private
   */
  function _nodeClass(id) {
    return `__n${id}`;
  }
  
  class GraphView extends View {
    /**
     * Initializes a new graph view.
     *
     * @param {StateStore} stateStore The state store to use for this graph
     */
    init(stateStore) {
      this.stateStore = require(stateStore, "state store must be non-null");

      this._rxSelectionSubject = new Rx.BehaviorSubject([]);
      this.rxSelection = this._rxSelectionSubject.distinctUntilChanged(null, arrayEquals)
    }

    render() {
      const $outer = createElement("div", "graph");
      this.$edges = createChildOf($outer, "div", "graph__edges");
      this.$nodes = createChildOf($outer, "div", "graph__nodes");

      this.$selection = createChildOf($outer, "div", "graph__selection");
      this.$selection.style.display = "none";

      this._setupMoveEventListeners($outer);
      this._setupKeyboardEventListeners($outer);

      // highlight currently selected nodes
      this.rxSelection.subscribe(selected => {
        this.nodes.forEach(node => {
          node.selected = selected.indexOf(node) !== -1;
        });
      });

      return $outer;
    }

    /**
     * Registers key events.
     *
     * @param {Element} $outer The outermost layer in the markup
     * @private
     */
    _setupKeyboardEventListeners($outer) {
      Rx.DOM.keypress(document)
        .filter(event => event.code === "KeyR" || event.code === "Delete")
        .flatMap(this.rxSelection.take(1))
        .subscribe(nodes => {
          this._clearSelection();
          nodes.forEach(node => node.destroy());
        });
    }

    /**
     * Clears the current selection.
     * @private
     */
    _clearSelection() {
      this._updateSelection([]);
    }

    /**
     * Updates the selection to the given array of nodes.
     * @param {GraphNodeView[]} nodes The new selection
     * @private
     */
    _updateSelection(nodes) {
      require(nodes, "Must provide an array of nodes");
      this._rxSelectionSubject.onNext(nodes);
    }

    /**
     * Sets up the mouse event listeners.
     * @param {Element} $outer The outermost layer in the markup.
     * @private
     */
    _setupMoveEventListeners($outer) {
      const primaryMousedown = Rx.DOM.mousedown($outer)
        .filter(event => event.button === 0)
        .share();

      primaryMousedown
        .filter(event => event.target.matches(".graph__node:not(.graph__node--selected)"))
        .map(event => View.of(event.target))
        .subscribe(node => this._updateSelection([node]));

      primaryMousedown
        .filter(event => event.target.classList.contains("graph__node--selected"))
        .flatMap(event => Rx.DOM.mousemove($outer)

          // stop on mouse up
          .takeUntil(Rx.Observable.merge(Rx.DOM.mouseup($outer)))

          // convert to delta vector
          .map(event => new Vector(event.movementX, event.movementY))

          // and move the graph using this vector.
          .withLatestFrom(this.rxSelection))

        .subscribe(([delta, nodes]) => this._moveNodesBy(delta, nodes));

      primaryMousedown
      // dont start selection on a node.
        .filter(event => !event.target.classList.contains("graph__node"))

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

          .map(bbox => this._intersectingNodes(bbox))

          // hide at the end
          .finally(() => this.$selection.style.display = "none"))

        .subscribe(nodes => this._updateSelection(nodes));
    }


    /**
     * Finds all nodes that are touched by the given rectangle
     * @param {Rect} bbox The bounding box to search nodes in
     * @returns {Array<GraphNodeView>}
     */
    _intersectingNodes(bbox) {
      function selectionTest(node) {
        return bbox.intersectsCircle(node.position, node.radius);
      }

      return this.nodes.filter(selectionTest);
    }

    /**
     * Moves nodes by the given delta. If the list of nodes is empty,
     * all nodes will be moved.
     * @param {Vector} delta
     * @param {Array.<GraphNodeView>} nodes The nodes shall be moved
     */
    _moveNodesBy(delta, nodes = []) {
      (nodes.length ? nodes : this.nodes)
        .map(node => [node, node.position.plus(delta)])
        .forEach(([node, pos]) => {
          node.moveTo(pos);
        });
    }

    /**
     * Connects two nodes
     * @param {GraphNodeView} first The first node
     * @param {GraphNodeView} second The second node.
     * @returns {GraphEdgeView}
     */
    connect(first, second) {
      const edge = new GraphEdgeView(first.rxPosition, second.rxPosition);
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
      return this.stateStore.positionOf(node.id) || new Vector(this.width / 2, this.height / 2)
          .plus(Vector.random().scaled(50 + 100 * Math.random()));
    }

    /**
     * Adds the given node to the graph view.
     * @param {GraphNodeView} node
     * @param {Vector|*} position
     */
    addNode(node, position = this._defaultNodePosition(node)) {
      node.$root.classList.add(_nodeClass(node.id));
      node.appendTo(this.$nodes);

      // move node to the provided position
      if (position) {
        node.moveTo(position);
      }

      // sync changes in the position back to the store
      node.rxPosition.debounce(100).subscribe(pos => {
        this.stateStore.positionOf(node.id, pos);
        this.stateStore.persist();
      });
    }

    /**
     * Looks for the edge. Returns a tuple with a boolean indicating
     * if the returned edge has the direction that was queried.
     *
     * @param {String} sourceId The id of the source node
     * @param {String} targetId The id of the target node
     * @returns {{edge: GraphEdgeView, reverse: boolean}}
     */
    edgeOf(sourceId, targetId) {
      const forward = this.$edges.querySelector(`:scope > .${_edgeClass(sourceId, targetId)}`);
      if (forward) {
        return {edge: View.of(forward), reverse: false};

      } else {
        const reverse = this.$edges.querySelector(`:scope > .${_edgeClass(targetId, sourceId)}`);
        if (reverse) {
          return {edge: View.of(reverse), reverse: true};
        }
      }

      return {edge: null, reverse: false};
    }

    /**
     * Finds and returns the node with the given id.
     * @returns {GraphNodeView}
     */
    nodeOf(nodeId) {
      if (nodeId instanceof GraphNodeView)
        return nodeId;

      if (nodeId == null)
        return null;

      const nodes = this.$nodes.querySelector("." + _nodeClass(nodeId));
      return nodes ? View.of(nodes) : null;
    }

    /**
     * Gets a node by id or create a new one in the graph
     * @param {String} nodeId Id of the new node.
     * @param {String|undefined} nearNodeId Places a newly created node near this one.
     * @returns {GraphNodeView}
     */
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

    /**
     * Gets an edge between nodes of the given ids.
     * @param {String} sourceId Id of the source node
     * @param {String} targetId Id of the second node
     * @returns {{edge: GraphEdgeView, reverse: boolean}}
     */
    getOrCreateEdge(sourceId, targetId) {
      const {edge, reverse} = this.edgeOf(sourceId, targetId);
      if (edge !== null)
        return {edge, reverse};

      const source = this.getOrCreateNode(sourceId);
      const target = this.getOrCreateNode(targetId, sourceId);
      return {edge: this.connect(source, target), reverse: false}
    }

    /**
     * Array of all the nodes-
     * @returns {Array<GraphNodeView>}
     */
    get nodes() {
      return Array.from(this.$nodes.childNodes, View.of);
    }
  }

  return GraphView;
})();
