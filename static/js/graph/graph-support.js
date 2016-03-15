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

function registerGraphSupportShortcuts(graph, eventTarget = document.body) {
  function withSelection(key, graph, eventTarget) {
    return Rx.DOM.keydown(eventTarget)
      .filter(event => event.target === eventTarget && event.code === key)
      .flatMap(event => graph.rxSelection.take(1))
      .filter(nodes => nodes.length > 1);
  }

  withSelection("KeyG", graph, eventTarget).subscribe(GraphSupport.gridNodes);
  withSelection("KeyL", graph, eventTarget).subscribe(GraphSupport.lineupNodes);
  withSelection("KeyC", graph, eventTarget).subscribe(GraphSupport.circleNodes);

  withSelection("Delete", graph, eventTarget).subscribe(nodes => {
    graph.clearSelection();
    nodes.forEach(node => node.destroy());
  });
}

