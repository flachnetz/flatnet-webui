"use strict";

function registerGroupNodes(key, graph, eventTarget = document.body) {
  function centerOfNodes(nodes) {
    return nodes
      .reduce((center, node) => center.plus(node.position), new Vector())
      .scaled(1 / nodes.length);
  }

  Rx.DOM.keydown(eventTarget)
    .filter(event => event.target === eventTarget)
    .filter(event => event.code === key)
    .flatMap(event => graph.rxSelection.take(1))
    .filter(nodes => nodes.length > 0)
    .subscribe(nodes => {
      const center = centerOfNodes(nodes);
      const columnCount = Math.ceil(Math.sqrt(nodes.length));
      const rowCount = Math.ceil(nodes.length / columnCount);

      const step = 75;
      const offset = center.minus(new Vector(columnCount - 1, rowCount - 1).scaled(step / 2));

      Array.from(nodes)
        .sort((a, b) => a.alias.localeCompare(b.alias))
        .forEach((node, idx) => {
          const posGrid = new Vector(idx % columnCount, Math.floor(idx / columnCount));
          node.moveTo(offset.plus(posGrid.scaled(step)));
        });
    });
}

