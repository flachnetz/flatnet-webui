"use strict";

window.onload = () => {
  const graph = new GraphView(StateStore.restore("test"));
  graph.appendTo(document.body);

  var source = new WebsocketTrafficSource();

  source.traffic.subscribe(ping => {
    const {edge, reverse} = graph.getOrCreateEdge(ping.source, ping.target);
    edge.ping(reverse);
  });

  source.mapping.debounce(100).subscribe(mapping => {
    graph.nodes.forEach(node => {
      const alias = mapping[node.id];
      if (alias) {
        node.alias = alias;
      }
    });
  });

  registerGraphSupportShortcuts(graph);
  
  // create a search view to open on ctrl-f
  const search = new SearchView();
  search.appendTo(document.body);
  SearchView.bindToShortcut(search);
  
  search.rxQueries.subscribe(term => {
    if(term === "") {
      graph.clearSelection();
    } else {
      graph.selectByTerm(term);
    }
  });
  
};
