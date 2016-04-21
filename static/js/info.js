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
          <strong>Alias:</strong> <span class="info__node__value info__node__value--alias"></span>
        </div>
      </div>`);

    this.$id = $root.querySelector(".info__node__value--id");
    this.$id.innerText = this.node.id;

    this.$alias = $root.querySelector(".info__node__value--alias");
    this.$alias.innerText = this.node.alias;

    return $root;
  }
}

class InfoPanel extends View {
  init(rxNodes) {
    this.rxNodes = rxNodes
      .map(nodes => nodes.sort((a, b) => a.id.localeCompare(b.id)));
  }

  render() {
    const $root = parseHtml(`
      <div class="info">
        <h1 class="info__header">Info</h1>
        <div class="info__nodes"></div>
      </div>
    `);

    this.$nodes = $root.querySelector(".info__nodes");

    this.rxNodes.subscribe(nodes => {
      Array.from(this.$nodes.childNodes).forEach(node => View.of(node).destroy());
      nodes.forEach(node => new NodeInfoView(this.$nodes, node));
    });

    return $root;
  }
}


