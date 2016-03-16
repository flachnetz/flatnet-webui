"use strict";

class InfoView extends View {
  render() {
    return parseHtml(`<div class="info"></div>`);
  }

  get text() {
    return this.$root.innerText;
  }

  set text(value) {
    this.$root.innerText = value;
  }
}


function infoViewForNodeObservable(rxNodes) {
  rxNodes
    .switchMap(node => {
      if(node == null)
        return Rx.Observable.empty();

      // create a new tooltip and let it mirror the node.
      const view = new InfoView(document.body);
      view.text = node.alias;
      return node.rxPosition
        .takeUntil(node.rxLifecycle)
        .finally(() => view.destroy())
        .doOnNext(pos => view.moveTo(pos));
    })
    .ignoreElements()
    .subscribe();
}
