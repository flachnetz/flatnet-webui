"use strict";

class ChunkedTrafficSource {
  constructor() {
  }

  get traffic() {
    return this.chunks
      .filter(chunk => chunk.type === "traffic")
      .flatMap(chunk => Rx.Observable.from(chunk.edges))
      .flatMap(packet => {
        const count = this.pingCount(packet);
        const duration = this.durationOf(packet);
        if (count === 0) {
          return Rx.Observable.empty();
        } else if (count === 1) {
          return Rx.Observable.just(packet);
        } else {
          return Rx.Observable.zip(
            Rx.Observable.interval(duration / count),
            Rx.Observable.range(0, count),
            () => ({source: packet.source, target: packet.target}));
        }
      });
  }

  get mapping() {
    return this.chunks
      .filter(chunk => chunk.type === "mapping")
      .scan((mapping, chunk) => {
        return Object.assign(mapping, chunk.mapping);
      }, {});
  }

  //noinspection JSMethodCanBeStatic
  pingCount(packet) {
    return packet.count || 1;
  }

  //noinspection JSMethodCanBeStatic
  durationOf(packet) {
    return packet.duration || 1000;
  }
}

class WebsocketTrafficSource extends ChunkedTrafficSource {
  constructor(uri = `ws://${location.host}/${location.pathname}/traffic`) {
    super();

    this.chunks = Rx.DOM.fromWebSocket(uri.replace(/\/\/+/g, "/"))
      // parse json and get the edges
      .map(event => JSON.parse(event.data))

      // log the package
      // .doOnNext(packet => console.log("Received package: ", packet))

      // retry on errors
      .retryWhen(errors => errors
        .doOnNext(error => console.log("Websocket error, reconnecting shortly:", error))
        .delay(1000))

      .share();
  }
}
