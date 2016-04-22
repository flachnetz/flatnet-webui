"use strict";

class NodeInfoView extends View {
  init(node) {
    this.node = node;
  }

  render() {
    const $root = parseHtml(`
      <div class="info__node">
        <div>
          <strong>Id:</strong> <span class="info__node__value info__node__value--id"></span>
        </div>
        <div>
          <strong>Alias:</strong> <input class="info__node__value info__node__value--alias">
        </div>
        <div>
          <strong>Received:</strong> <span class="info__node__value info__node__value--received"></span>
        </div>
      </div>`);

    const $id = $root.querySelector(".info__node__value--id");
    $id.innerText = this.node.id;

    const $received = $root.querySelector(".info__node__value--received");
    this.node.rxDataReceived.subscribe(total => $received.innerText = total);

    const $alias = $root.querySelector(".info__node__value--alias");
    this.node.rxAlias.subscribe(alias => $alias.value = alias);

    Rx.DOM.change($alias)
      .map(event => $alias.value)
      .subscribe(alias => this.node.alias = alias);

    return $root;
  }
}

class InfoPanel extends View {
  init(rxNodes) {
    this.rxNodes = rxNodes
      .map(nodes => nodes.sort((a, b) => a.id.localeCompare(b.id)));
  }

  render() {
    const $root = this.$root = parseHtml(`
      <div class="info">
        <h1 class="info__header">Info</h1>
        <div class="info__nodes"></div>
      </div>
    `);

    this.$nodes = $root.querySelector(".info__nodes");

    this.rxNodes.subscribe(nodes => {
      Array.from(this.$nodes.childNodes).forEach(node => View.of(node).destroy());
      nodes.forEach(node => new NodeInfoView(this.$nodes, node));

      this.hidden = (nodes.length == 0);
    });

    return $root;
  }

  set hidden(hidden) {
    if(hidden) {
      this.$root.classList.add("info--hidden")
    } else {
      this.$root.classList.remove("info--hidden")
    }
  }

  get hidden() {
    return this.$root.classList.contains("info--hidden");
  }
}


