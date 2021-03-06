"use strict";

window.onload = () => {
  const graph = new GraphView(document.body, StateStore.restore("test"));

  const source = new WebsocketTrafficSource();

  const mapper = new GroupMapper();

  source.traffic.subscribe(ping => {
    const sourceId = mapper.map(ping.source);
    const targetId = mapper.map(ping.target);

    const {edge, reverse} = graph.getOrCreateEdge(sourceId, targetId);
    edge.ping(reverse);

    graph.getOrCreateNode(sourceId).logTraffic(0, 1);
    graph.getOrCreateNode(targetId).logTraffic(1, 0);
  });

  source.mapping.debounce(100).subscribe(mapping => {
    graph.nodes.forEach(node => {
      const alias = mapping[node.id];
      if (alias) {
        if(node.id === node.alias) {
          node.alias = alias;
        }
      }
    });
  });

  registerGraphSupportShortcuts(graph, mapper);

  // create a search view to open on ctrl-f and bind it to the graph.
  const search = new SearchView(document.body);
  SearchView.registerShortcut(search);
  registerGraphSearchView(graph, search);

  var info = new InfoPanel(document.body, graph.rxSelection
    .combineLatest(graph.rxSelectionMarker)
    .filter(([nodes, mark]) => mark && nodes.length === 0 || !mark && nodes.length > 0)
    .map(([nodes, mark]) => nodes)
    .startWith([]));
};
