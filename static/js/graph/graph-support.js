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
    },


    /**
     * Groups the given nodes on the graph using the group mapper.
     *
     * @param {GraphView} graph
     * @param {GroupMapper} mapper
     * @param {GraphNodeView[]} nodes
     */
    groupNodes(graph, mapper, nodes) {
      const nodeIds = nodes.map(node => node.id);

      const pattern = new RegExp(nodeIds.join("|"));
      const target = "group-" + Date.now();
      const alias = prompt("Please input an alias for the new group");

      const mapping = mapper.newMapping(pattern, target);
      mapping.nodeIds = nodeIds;

      const node = graph.getOrCreateNode(target);
      node.moveTo(centerOfNodes(nodes));
      node.alias = alias;
      graph.updateSelection([node]);

      // destroy original nodes.
      nodes.forEach(node => node.destroy());
    },

    /**
     * Removes all groups for the given nodes.
     *
     * @param {GraphView} graph
     * @param {GroupMapper} mapper
     * @param {GraphNodeView[]} nodes
     */
    ungroupNodes(graph, mapper, nodes) {
      const newNodes = [];
      nodes.forEach(node => {
        mapper.remove(node.id).forEach(mapping => {
          (mapping.nodeIds || []).forEach(nodeId => {
            newNodes.push(graph.getOrCreateNode(nodeId));
          })
        });

        node.destroy();
      });

      graph.updateSelection(newNodes);
    }
  };
}());

/**
 * Registers shortcuts for a graph.
 *
 * @param {GraphView} graph The graph to enhance.
 * @param {GroupMapper} mapper The mapper that is used to map node ids.
 * @param {Element} eventTarget Element to register events on. Defaults to body.
 */
function registerGraphSupportShortcuts(graph, mapper, eventTarget = document.body) {
  const keydownEvents = Rx.DOM.keydown(eventTarget).share();

  function keyEvents(key) {
    return keydownEvents
      .filter(event => event.target === eventTarget && matchesKey(event, key))
      .doOnNext(event => event.preventDefault());
  }

  function keyWithSelection(key, minCount = 1) {
    return keyEvents(key)
      .flatMap(event => graph.rxSelection.take(1))
      .filter(nodes => nodes.length > minCount);
  }

  keyWithSelection("KeyG").subscribe(GraphSupport.gridNodes);
  keyWithSelection("KeyL").subscribe(GraphSupport.lineupNodes);
  keyWithSelection("KeyC").subscribe(GraphSupport.circleNodes);

  keyWithSelection("KeyA").subscribe(nodes => GraphSupport.groupNodes(graph, mapper, nodes));
  keyWithSelection("KeyU", 0).subscribe(nodes => GraphSupport.ungroupNodes(graph, mapper, nodes));

  keyWithSelection("Delete", 0).subscribe(nodes => {
    graph.clearSelection();
    nodes.forEach(node => node.destroy());
  });

  keyEvents({code: "KeyA", ctrl: true}).subscribe(() => GraphSupport.selectAllNodes(graph));
  keyEvents("Escape").subscribe(() => graph.clearSelection());
}

/**
 * Binds a search view to the given graph.
 * @param {GraphView} graph The graph to serach
 * @param {SearchView} search The search view to bind.
 */
function registerGraphSearchView(graph, search) {
  search.rxQueries.map(term => term.trim()).subscribe(term => {
    if (term === "") {
      graph.clearSelection();
    } else {
      graph.selectByTerm(term);
    }
  });
}
