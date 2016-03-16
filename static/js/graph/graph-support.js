"use strict";

const GraphSupport = (function () {
  const STEP = 80;

  function centerOfNodes(nodes) {
    return nodes
      .reduce((center, node) => center.plus(node.position), new Vector())
      .scaled(1 / nodes.length);
  }

  function sortedNodes(nodes) {
    return Array.from(nodes).sort((a, b) => a.alias.localeCompare(b.alias))
  }

  return {
    /**
     * Selects all nodes in a graph
     * @param {GraphView} graph
     */
    selectAllNodes(graph) {
      if (graph.nodes.every(node => node.selected)) {
        graph.clearSelection();
      } else {
        graph.updateSelection(graph.nodes);
      }
    },

    gridNodes(nodes) {
      const center = centerOfNodes(nodes);
      const columnCount = Math.ceil(Math.sqrt(nodes.length));
      const rowCount = Math.ceil(nodes.length / columnCount);

      const offset = center.minus(new Vector(columnCount - 1, rowCount - 1).scaled(STEP / 2));

      sortedNodes(nodes).forEach((node, idx) => {
        const posGrid = new Vector(idx % columnCount, Math.floor(idx / columnCount));
        node.moveTo(offset.plus(posGrid.scaled(STEP)));
      });
    },

    circleNodes(nodes) {
      const center = centerOfNodes(nodes);
      const radius = nodes.length * STEP / (2 * Math.PI);
      const angleStep = 2 * Math.PI / nodes.length;

      sortedNodes(nodes).forEach((node, idx) => {
        const offset = Vector.polar(idx * angleStep - Math.PI / 2, radius);
        node.moveTo(center.plus(offset));
      });
    },

    lineupNodes(nodes) {
      let startVector = nodes[0].position;
      let vertical = true;
      nodes.forEach(node => {
        if (node.position.normSq < startVector.normSq)
          startVector = node.position;

        if (node.position.y - startVector.y > 1)
          vertical = false;
      });

      const step = vertical ? new Vector(0, STEP) : new Vector(STEP, 0);
      sortedNodes(nodes).forEach((node, idx) => {
        node.moveTo(startVector.plus(step.scaled(idx)));
      });
    }
  };
}());

/**
 * Registers shortcuts for a graph.
 *
 * @param {GraphView} graph The graph to enhance.
 * @param {Element} eventTarget Element to register events on. Defaults to body.
 */
function registerGraphSupportShortcuts(graph, eventTarget = document.body) {
  const keydownEvents = Rx.DOM.keydown(eventTarget).share();

  function keyEvents(key) {
    return keydownEvents
      .filter(event => event.target === eventTarget && matchesKey(event, key))
      .doOnNext(event => event.preventDefault());
  }

  function keyWithSelection(key) {
    return keyEvents(key)
      .flatMap(event => graph.rxSelection.take(1))
      .filter(nodes => nodes.length > 1);
  }

  keyWithSelection("KeyG").subscribe(GraphSupport.gridNodes);
  keyWithSelection("KeyL").subscribe(GraphSupport.lineupNodes);
  keyWithSelection("KeyC").subscribe(GraphSupport.circleNodes);

  keyWithSelection("Delete").subscribe(nodes => {
    graph.clearSelection();
    nodes.forEach(node => node.destroy());
  });

  keyEvents({code: "KeyA", ctrl: true}).subscribe(() => GraphSupport.selectAllNodes(graph));
  keyEvents("Escape").subscribe(() => graph.clearSelection());
}

