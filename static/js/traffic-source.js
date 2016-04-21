"use strict";

class ChunkedTrafficSource {
  constructor() {
  }

  get traffic() {
    return this.chunks
      .filter(chunk => chunk.type === "traffic")
      .flatMap(chunk => Rx.Observable.from(chunk.pings || []))
      .flatMap(packet => {
        const count = this.pingCount(packet);
        const duration = this.durationOf(packet);
        if (count === 0) {
          return Rx.Observable.empty();
        } else if (count === 1) {
          return Rx.Observable.just(packet);
        } else {
          const cappedCount = Math.min(10, count);
          return Rx.Observable.zip(
            Rx.Observable.interval(duration / cappedCount),
            Rx.Observable.range(0, cappedCount),
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
      .map(event => JSON.parse(event.data))

      // retry on errors
      .retryWhen(errors => errors
        .doOnNext(error => console.log("Websocket error, reconnecting shortly:", error))
        .delay(1000))

      .share();
  }
}
