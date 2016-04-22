const GraphNodeView = (() => {
  class GraphNodeView extends View {
    init(id) {
      this._id = id;
      this._position = new Rx.BehaviorSubject();
      this._size = undefined;

      this._rxAliasSubject = new Rx.BehaviorSubject(id);
      this.rxAlias = this._rxAliasSubject
        .distinctUntilChanged()
        .takeUntil(this.rxLifecycle);

      this._rxDataReceivedSubject = new Rx.Subject(0);
      this.rxDataReceived = this._rxDataReceivedSubject
        .takeUntil(this.rxLifecycle)
        .scan((sum, value) => sum + value, 0)
        .shareReplay(1);
    }

    render() {
      const el = createElement("div", "graph__node");
      el.innerText = this.id;
      return el;
    }

    destroy() {
      super.destroy();
      this._position.onCompleted();
    }

    logTraffic(incoming, outgoing) {
      if(incoming) {
        this._rxDataReceivedSubject.onNext(incoming);
      }
    }
    
    /**
     * The id of this node.
     * @returns {String}
     */
    get id() {
      return this._id;
    }

    /**
     * Returns an observable with the current position of this node.
     * @returns {Rx.Observable<Vector>}
     */
    get rxPosition() {
      return this._position.filter(pos => pos != null).map(Vector.of);
    }

    /**
     * Get the radius by using half of the maximum of height and width.
     * @returns {number}
     */
    get radius() {
      return Math.max(this.width, this.height) / 2;
    }

    /**
     * Returns the position of this node.
     * @returns {Vector}
     */
    get position() {
      return super.position.plus(this.size.scaled(0.5));
    }

    get width() {
      return this.size.x;
    }

    get height() {
      return this.size.y;
    }

    get size() {
      return this._size
        ? this._size
        : this._size = super.size;
    }

    get alias() {
      return this.$root.innerText;
    }

    set alias(alias) {
      this.$root.innerText = alias;
      this._rxAliasSubject.onNext(alias);
    }

    get selected() {
      return this.$root.classList.contains("graph__node--selected");
    }

    set selected(selected) {
      if (selected) {
        this.$root.classList.add("graph__node--selected");
      } else {
        this.$root.classList.remove("graph__node--selected");
      }
    }

    /**
     * Changes the position of this node. This will trigger a change in
     * the position observable.
     */
    moveTo(pos) {
      const center = Vector.of(pos);
      super.moveTo(center.minus(this.size.scaled(0.5)));
      this._position.onNext(center);
    }
  }

  return GraphNodeView;
})();
