"use strict";

class SearchView extends View {
  render() {
    const $view = parseHtml(`
      <form class="search search--hidden">
        <input type="search" placeholder="search term" class="search__input">
      </form>`);

    this.$input = $view.querySelector("input");

    const queries = new Rx.Subject();
    Rx.DOM.keyup(this.$input)
      .map(event => event.target.value)
      .distinctUntilChanged()
      .subscribe(queries);

    Rx.DOM.keydown(document)
      .filter(event => event.code === "Escape" && this.visible)
      .subscribe(() => {
        queries.onNext("");
        this.hide();
      });

    Rx.DOM.submit($view)
      .doOnNext(event => event.preventDefault())
      .subscribe(event => this.hide());

    /**
     * @type {Rx.Subject<String>}
     */
    this.rxQueries = queries.takeUntil(this.rxLifecycle);
    
    return $view;
  }

  hide() {
    this.$root.classList.add("search--hidden");
  }

  show() {
    this.$root.classList.remove("search--hidden");

    this.$input.select();
    this.$input.focus();
  }

  get visible() {
    return !this.$root.classList.contains("search--hidden");
  }

  /**
   * Binds the given search view to the ctrl-f search shortcut.
   * @param {SearchView} searchView The searchview to bind.
   */
  static registerShortcut(searchView) {
    const closer = searchView.rxQueries
      .ignoreElements()
      .concat(Rx.Observable.just(true));

    Rx.DOM.keydown(document)
      .takeUntil(closer)
      .filter(event => matchesKey(event, {ctrl: true, code: "KeyF"}))
      .doOnNext(event => event.preventDefault())
      .subscribe(() => searchView.show());
  }
}
