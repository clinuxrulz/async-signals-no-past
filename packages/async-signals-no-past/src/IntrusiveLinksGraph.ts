import { IntrusiveLinkedList, IntrusiveLinkedListData, IntrusiveLinkedListElement } from "./IntrusiveLinkedList";

export interface Link<N> {
  dep: N;
  sub: N;
  prevDep: Link<N> | undefined;
  nextDep: Link<N> | undefined;
  prevSub: Link<N> | undefined;
  nextSub: Link<N> | undefined;
}

let depsElementImplAnyN: IntrusiveLinkedListElement<Link<any>> = {
  prev(self) {
    return self.prevDep;
  },
  setPrev(self, x) {
    self.prevDep = x;  
  },
  next(self) {
    return self.nextDep;
  },
  setNext(self, x) {
    self.nextDep = x;
  },
};

function depsElementImpl<N>(): IntrusiveLinkedListElement<Link<N>> {
  return depsElementImplAnyN as unknown as IntrusiveLinkedListElement<Link<N>>;
}

let subsElementImplAnyN: IntrusiveLinkedListElement<Link<any>> = {
  prev(self) {
    return self.prevSub;
  },
  setPrev(self, x) {
    self.prevSub = x;  
  },
  next(self) {
    return self.nextSub;
  },
  setNext(self, x) {
    self.nextSub = x;
  },
};

function subsElementImpl<N>(): IntrusiveLinkedListElement<Link<N>> {
  return subsElementImplAnyN as unknown as IntrusiveLinkedListElement<Link<N>>;
}

export interface IntrusiveLinksNode<N> {
  readonly deps: IntrusiveLinkedListData<N,Link<N>>;
  readonly subs: IntrusiveLinkedListData<N,Link<N>>;
}

export class IntrusiveLinksGraph<N> {
  nodeImpl: IntrusiveLinksNode<N>;
  depsImpl: IntrusiveLinkedList<N,Link<N>>;
  subsImpl: IntrusiveLinkedList<N,Link<N>>;
  constructor(
    nodeImpl: IntrusiveLinksNode<N>,
  ) {
    this.nodeImpl = nodeImpl;
    this.depsImpl = new IntrusiveLinkedList(
      nodeImpl.deps,
      depsElementImpl<N>(),
    );
    this.subsImpl = new IntrusiveLinkedList(
      nodeImpl.subs,
      subsElementImpl<N>(),
    );
  }

  addLink(link: Link<N>) {
    this.depsImpl.add(link.sub, link);
    this.subsImpl.add(link.dep, link);
  }

  removeLink(link: Link<N>) {
    this.depsImpl.remove(link.sub, link);
    this.subsImpl.remove(link.dep, link);
  }
}

