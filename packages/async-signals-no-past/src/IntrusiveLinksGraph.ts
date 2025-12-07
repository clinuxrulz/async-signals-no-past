import { IntrusiveLinkedList, IntrusiveLinkedListData, IntrusiveLinkedListElement } from "./IntrusiveLinkedList";

export interface IntrusiveLinksNode<N,L> {
  readonly deps: IntrusiveLinkedListData<N,L>;
  readonly subs: IntrusiveLinkedListData<N,L>;
}

export interface IntrusiveLinksLink<Self,N> {
  depsElementImpl(self: Self): IntrusiveLinkedListElement<Self>;
  subsElementImpl(self: Self): IntrusiveLinkedListElement<Self>;
  dep(self: Self): N;
  sub(self: Self): N;
}

export class InstrusiveLinksGraph<N,L> {
  nodeImpl: IntrusiveLinksNode<N,L>;
  linkImpl: IntrusiveLinksLink<L,N>;
  depsLinkListImpl: IntrusiveLinkedList<N,L>;
  subsLinkListImpl: IntrusiveLinkedList<N,L>;

  constructor(
    nodeImpl: IntrusiveLinksNode<N,L>,
    linkImpl: IntrusiveLinksLink<L,N>,
  ) {
    this.nodeImpl = nodeImpl;
    this.linkImpl = linkImpl;
    this.depsLinkListImpl = new IntrusiveLinkedList<N,L>(
      nodeImpl.deps,
      {
        prev(self) {
          return linkImpl.depsElementImpl(self).prev(self);
        },
        setPrev(self, x) {
          linkImpl.depsElementImpl(self).setPrev(self, x);
        },
        next(self) {
          return linkImpl.depsElementImpl(self).next(self);
        },
        setNext(self, x) {
          linkImpl.depsElementImpl(self).setNext(self, x);
        },
      },
    );
    this.subsLinkListImpl = new IntrusiveLinkedList<N,L>(
      nodeImpl.deps,
      {
        prev(self) {
          return linkImpl.depsElementImpl(self).prev(self);
        },
        setPrev(self, x) {
          linkImpl.depsElementImpl(self).setPrev(self, x);
        },
        next(self) {
          return linkImpl.depsElementImpl(self).next(self);
        },
        setNext(self, x) {
          linkImpl.depsElementImpl(self).setNext(self, x);
        },
      },
    );
  }

  addLink(link: L) {
    this.depsLinkListImpl.add(this.linkImpl.sub(link), link);
    this.subsLinkListImpl.add(this.linkImpl.dep(link), link);
  }

  removeLink(link: L) {
    this.depsLinkListImpl.remove(this.linkImpl.sub(link), link);
    this.subsLinkListImpl.remove(this.linkImpl.dep(link), link);
  }
}
