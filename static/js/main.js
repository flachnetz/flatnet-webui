"use strict";

jQuery(() => {
  const graph = new GraphView(StateStore.restore("test"));
  graph.appendTo(jQuery("body"));

  var source = new WebsocketTrafficSource();

  source.traffic.subscribe(ping => {
    const [edge, reversed] = graph.getOrCreateEdge(ping.source, ping.target);
    edge.ping(reversed);
  });

  source.mapping.debounce(100).subscribe(mapping => {
    graph.nodes.forEach(node => {
      const alias = mapping[node.id];
      if (alias) {
        node.alias = alias;
      }
    });
  });

});
