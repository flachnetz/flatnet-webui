
class GraphEdgeView extends View {
  /**
   * Connects two positions
   *
   * @param {Rx.Observable} source
   * @param {Rx.Observable} target
   */
  init(source, target) {
    this._source = source.map(Vector.of);
    this._target = target.map(Vector.of);
  }

  render() {
    const view = createElement("div", "graph__edge");

    const closer = Rx.Observable.merge(
      this._source.ignoreElements().concat(Rx.Observable.just(true)),
      this._target.ignoreElements().concat(Rx.Observable.just(true)));

    Rx.Observable.combineLatest(this._source, this._target)
      .takeUntil(closer)

      .finally(() => this.destroy())
      .subscribe(args => {
        const [source, target] = args;
        const angle = source.angleTo(target);
        const length = source.distanceTo(target);

        const st = view.style;
        st.top = `${source.y}px`;
        st.left = `${source.x}px`;
        st.width = `${length}px`;
        st.transform = `rotate(${angle}rad)`;
      });

    return view;
  }

  ping(reversed = false, duration = 2000) {
    const $packet = createElement("div",
      "graph__edge__packet",
      `graph__edge__packet--${reversed ? 'reverse' : 'normal'}`);

    $packet.style.transitionDuration = `${duration}ms`;
    this.$root.appendChild($packet);

    // set the class after layout and rendering
    Rx.Observable.timer(100)
      .doOnNext(() => $packet.classList.add("graph__edge__packet--on"))
      .delay(100 + duration)
      .subscribe(() => $packet.parentNode.removeChild($packet));
  }
}
