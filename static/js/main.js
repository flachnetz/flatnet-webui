"use strict";

jQuery(() => {
  const graph = new GraphView(StateStore.restore("test"));
  graph.appendTo(jQuery("body"));

  new WebsocketTrafficSource().traffic.subscribe(ping => {
    const [edge, reversed] = graph.getOrCreateEdge(ping.source, ping.target);
    edge.ping(reversed);
  });
});
