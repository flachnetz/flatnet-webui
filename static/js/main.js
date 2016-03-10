"use strict";

class View {
  render() {
    return jQuery("<div>");
  }

  update() {
    // implement
  }

  updateOn(observable) {
    if (this.subscription) {
      this.subscription.cancel();
    }

    this.subscription = observable.delaySubscription(0).subscribe(value => this.update(value));
  }

  appendTo($parent) {
    if (this.$root) {
      throw new Error("Already rendered");
    }

    const view = this.render();
    view.data("__view", this);
    $parent.append(this.$root = view);
  }

  static of(el) {
    const result = jQuery.data(el, "__view");
    if (result === null || result === undefined)
      throw new Error("No view on this element");

    return result;
  }
}

class RxView extends View {
  constructor(observable) {
    super();
    this.updateOn(value => this.update(value));
  }

  update(value) {
    // do nothing with value.
  }
}

class GraphNodeView extends View {
  constructor(id) {
    super();
    this.id = id;
    this._position = new Rx.BehaviorSubject();
  }

  render() {
    const view = jQuery(`<div class="graph__node">`);
    view.draggable({
      drag: (event, ui) => this._position.onNext(ui.position)
    });

    // .draggable sets the position to relative, thats not what i want
    view.css({position: "absolute"});

    this._position.onNext(view.position());

    return view;
  }

  update(value) {
  }

  get position() {
    return this._position.filter(pos => pos !== undefined).map(pos => {
      const width = this.$root.width();
      const height = this.$root.height();
      return new Vector(pos.left + width / 2, pos.top + height / 2);
    })
  }

  set position(pos) {
    const width = this.$root.width();
    const height = this.$root.height();

    const target = Vector.of(pos).minus(new Vector(width / 2, height / 2));
    this.$root.css({left: target.x, top: target.y});
    this._position.onNext(this.$root.position());
  }
}

class GraphEdgeView extends View {
  /**
   * Connects two positions
   *
   * @param source
   * @param target
   */
  constructor(source, target) {
    super();
    this._source = source.map(Vector.of);
    this._target = target.map(Vector.of);
  }

  render() {
    const view = jQuery(`<div class="graph__edge">`);
    this._source.combineLatest(this._target).subscribe(args => {
      const [source, target] = args;
      const angle = source.angleTo(target);

      view.css({
        top: source.y,
        left: source.x,
        width: source.distanceTo(target),
        transform: `rotate(${angle}rad)`
      });
    });

    return view;
  }

  addStream(duration = 2000) {
    const $packet = jQuery(`<div class="graph__edge__packet">`)
      .css("transition-duration", duration + "ms")
      .appendTo(this.$root);

    // set the class after layout and rendering
    Rx.Observable.just($packet)
      .delay(100)
      .doOnNext(() => $packet.addClass("graph__edge__packet--on"))
      .delay(100 + duration)
      .subscribe(() => $packet.remove());
  }
}

class GraphView extends View {
  render() {
    const outer = jQuery(`<div class="graph">`);
    this.$edges = jQuery(`<div class="graph__edges">`).appendTo(outer);
    this.$nodes = jQuery(`<div class="graph__nodes">`).appendTo(outer);
    return outer;
  }

  connect(first, second) {
    const edge = new GraphEdgeView(first.position, second.position);
    edge.appendTo(this.$edges);
    return edge;
  }

  addNode(node) {
    node.appendTo(this.$nodes);
  }

  get nodes() {
    return this.$nodes.children().toArray().map(View.of);
  }
}

/**
 * Helper class to save and restore the position of nodes
 */
class NodeStore {
  constructor(graphId = "default") {
    this.positions = {};
    this.graphId = graphId;
  }

  storeOnChange(nodes) {
    Rx.Observable.fromArray(nodes)
      .flatMap(node => node.position.debounce(100).distinctUntilChanged())
      .flatMapLatest(change => NodeStore.positions(nodes))
      .map(JSON.stringify)
      .subscribe(positions => localStorage.setItem(`nodes:pos:${this.graphId}`, positions));
  }

  restore(nodes) {
    const positions = JSON.parse(localStorage.getItem(`nodes:pos:${this.graphId}`) || "{}");
    nodes.forEach(node => {
      const pos = positions[node.id];
      if (pos !== undefined) {
        node.position = pos;
      }
    });
  }

  /**
   * Accumulates the current positions of all the nodes in the graph.
   */
  static positions(nodes) {
    return Rx.Observable.fromArray(nodes)
      .flatMap(node => node.position.take(1).map(pos => ({node: node, pos: pos})))
      .reduce((acc, {node, pos}) => {
        acc[node.id] = [pos.x, pos.y];
        return acc;
      }, {});
  }
}

jQuery(() => {
  const container = new GraphView();
  container.appendTo(jQuery("body"));

  Rx.Observable.range(0, 5)
    .map(idx => new GraphNodeView(`node-${idx}`))
    .doOnNext(node => container.addNode(node))
    .toArray()
    .subscribe(nodes => {
      //noinspection UnnecessaryLocalVariableJS
      const [a,b,c,d,e] = nodes;
      [[a, c], [b, c], [c, d], [c, e]].forEach(pair => {
        //noinspection UnnecessaryLocalVariableJS
        const [first, second] = pair;
        const edge = container.connect(first, second);

        const ping = () => {
          edge.addStream();
          setTimeout(ping, 500 * Math.random() + 250);
        };

        ping();
      });

      const nodeStore = new NodeStore();
      nodeStore.restore(nodes);
      nodeStore.storeOnChange(nodes);
    });
});
