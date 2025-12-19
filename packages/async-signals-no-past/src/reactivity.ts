import { FallbackHeap, IntrusiveFallbackHeapElement } from "./IntrusiveFallbackHeap";
import { InstrusivePriorityQueueElement, IntrusiveIndexedPriorityQueue, PqRank } from "./IntrusiveIndexedPriorityQueue";
import { IntrusiveLinksGraph, Link } from "./IntrusiveLinksGraph";

const enum ReactiveFlags {
  None = 0,
  Check = 1 << 0,
  Dirty = 1 << 1,
  RecomputingDeps = 1 << 2,
  InHeap = 1 << 3,
  InFallbackHeap = 1 << 4,
}

export enum NodeUpdateResult {
  SEIZE_FIRE,
  FIRE,
}

export type NodeUpdateFn = () => NodeUpdateResult;

export class Node {
  flags: ReactiveFlags = ReactiveFlags.None;
  pqRank: PqRank = 0;

  get inPq(): boolean {
    return (this.flags & ReactiveFlags.InHeap) != 0;
  }
  set inPq(x: boolean) {
    if (x) {
      this.flags |= ReactiveFlags.InHeap;
    } else {
      this.flags &= ~ReactiveFlags.InHeap;
    }
  }

  get inFallbackHeap(): boolean {
    return (this.flags & ReactiveFlags.InFallbackHeap) != 0;
  }
  set inFallbackHeap(x: boolean) {
    if (x) {
      this.flags |= ReactiveFlags.InFallbackHeap;
    } else {
      this.flags &= ~ReactiveFlags.InFallbackHeap;
    }
  }

  prev: Node | undefined = undefined;
  next: Node | undefined = undefined;
  subs: Link<Node> | undefined = undefined;
  subsTail: Link<Node> | undefined = undefined;
  deps: Link<Node> | undefined = undefined;
  depsTail: Link<Node> | undefined = undefined;
  disposal: (() => void) | (() => void)[] | null = null;
  update: NodeUpdateFn;

  constructor(
    update: NodeUpdateFn
  ) {
    this.update = update;
  }

  dispose() {
    if (this.disposal == null) {
      return;
    }
    if (this.disposal instanceof Function) {
      this.disposal();
      this.disposal = null;
      return;
    }
    for (let disposal of this.disposal) {
      disposal();
    }
    this.disposal = null;
  }
}

export const priorityQueue = new IntrusiveIndexedPriorityQueue<Node>({
  pqRank(self) {
    return self.pqRank;
  },
  setPqRank(self, x) {
    self.pqRank = x;
  },
  inPq(self) {
    return (self.flags & ReactiveFlags.InHeap) != 0;
  },
  setInPq(self, x) {
    if (x) {
      self.flags |= ReactiveFlags.InHeap;
    } else {
      self.flags &= ~ReactiveFlags.InHeap;
    }
  },
  prev(self) {
    return self.prev;
  },
  setPrev(self, x) {
    self.prev = x;
  },
  next(self) {
    return self.next;
  },
  setNext(self, x) {
    self.next = x;
  },
});
export const fallbackHeap = new FallbackHeap<Node>({
  inFallbackHeap(self) {
    return self.inFallbackHeap;
  },
  setInFallbackHeap(self, x) {
    self.inFallbackHeap = x;
  },
  prev(self) {
    return self.prev;
  },
  setPrev(self, x) {
    self.prev = x;
  },
  next(self) {
    return self.next;
  },
  setNext(self, x) {
    self.next = x;
  },
});
export const linksGraph = new IntrusiveLinksGraph<Node>({
  deps: {
    head(self) {
      return self.deps;
    },
    setHead(self, x) {
      self.deps = x;
    },
    tail(self) {
      return self.depsTail;
    },
    setTail(self, x) {
      self.depsTail = x;
    },
  },
  subs: {
    head(self) {
      return self.subs;
    },
    setHead(self, x) {
      self.subs = x;
    },
    tail(self) {
      return self.subsTail;
    },
    setTail(self, x) {
      self.subsTail = x;
    },
  },
});
export let owner: Node | undefined = undefined;
export let observer: Node | undefined = undefined;
export let atRank: PqRank | undefined = undefined;

function withOwner<A>(innerOwner: Node, k: () => A): A {
  let outerOwner = owner;
  let result: A;
  try {
    owner = innerOwner;
    result = k();
  } finally {
    owner = outerOwner;
  }
  return result;
}

function withObserver<A>(innerObserver: Node | undefined, k: () => A): A {
  let outerObserver = observer;
  let result: A;
  try {
    observer = innerObserver;
    result = k();
  } finally {
    observer = outerObserver;
  }
  return result;
}

function withOwnerAndObserver<A>(innerOwnerAndObserver: Node, k: () => A): A {
  let outerOwner = owner;
  let outerObserver = observer;
  let result: A;
  try {
    owner = innerOwnerAndObserver;
    observer = innerOwnerAndObserver;
    result = k();
  } finally {
    owner = outerOwner;
    observer = outerObserver;
  }
  return result;
}

export type Accessor<A> = () => A;
export type Setter<A> = (x: A) => void;
export type Signal<A> = [ Accessor<A>, Setter<A>, ];

let requestFlush = (() => {
  let aboutToFlush = false;
  return () => {
    if (aboutToFlush) {
      return;
    }
    aboutToFlush = true;
    queueMicrotask(() => {
      aboutToFlush = false;
      flush();
    });
  };
})();

function flush() {
  while (true) {
    let node = priorityQueue.dequeue();
    if (node == undefined) {
      break;
    }
    atRank = node.pqRank;
    recompute(node);
  }
  atRank = undefined;
  // clear out fallback heap
  while (true) {
    let node = fallbackHeap.pop();
    if (node == undefined) {
      break;
    }
    node.flags &= ~(ReactiveFlags.Check | ReactiveFlags.Dirty);
  }
}

export function untrack<A>(k: () => A): A {
  return withObserver(undefined, k);
}

export function createSignal<A>(a: A): Signal<A> {
  let value: A = a;
  let node = new Node(() => NodeUpdateResult.FIRE);
  let setter: Setter<A> = (x: A) => {
    value = x;
    for (let sub = node.subs; sub != undefined; sub = sub.nextDep) {
      let sub2 = sub.dep;
      if (sub2.inFallbackHeap) {
        sub2.flags |= ReactiveFlags.Dirty;
        propergateCheckFlags(sub2);
      } else {
        priorityQueue.enqueue(sub2);
      }
    }
    requestFlush();
  };
  return [
    makeAccessor(node, () => value),
    setter,
  ];
}

function propergateCheckFlags(node: Node) {
  for (let sub = node.subs; sub != undefined; sub = sub.nextSub) {
    let sub2 = sub.sub;
    if (!sub2.inFallbackHeap) {
      continue;
    }
    sub2.flags |= ReactiveFlags.Check;
    propergateCheckFlags(sub2);
  }
}

export function createMemo<A>(fn: () => A): Accessor<A> {
  let updateFn: () => A;
  let node = new Node(() => {
    let newValue = updateFn();
    let result = (newValue === value) ? NodeUpdateResult.SEIZE_FIRE : NodeUpdateResult.FIRE;
    value = newValue;
    return result;
  });
  updateFn = () => withOwnerAndObserver(node, () => {
    linksGraph.clearDeps(node);
    return fn();
  });
  let value: A = updateFn();
  return makeAccessor(node, () => value);
}

function recompute(node: Node) {
  node.dispose();
  for (let dep = node.deps; dep != undefined; dep = dep.nextDep) {
    linksGraph.removeLink(dep);
  }
  let updateResult = node.update();
  if (updateResult == NodeUpdateResult.FIRE) {
    for (let sub = node.subs; sub != undefined; sub = sub.nextSub) {
      let sub2 = sub.sub;
      if (sub2.inFallbackHeap) {
        sub2.flags |= ReactiveFlags.Dirty;
      } else {
        priorityQueue.enqueue(sub2);
      }
    }
  }
}

function updateIfNecessary(el: Node): void {
  priorityQueue.remove(el);
  if (el.flags & ReactiveFlags.Check) {
    for (let d = el.deps; d; d = d.nextDep) {
      const dep = d.dep;
      updateIfNecessary(dep);
      if (el.flags & ReactiveFlags.Dirty) {
        break;
      }
    }
  }
  if (el.flags & ReactiveFlags.Dirty) {
    recompute(el);
  }
  el.flags &= ~(ReactiveFlags.Dirty | ReactiveFlags.Check);
}

function makeAccessor<A>(node: Node, readValue: () => A): Accessor<A> {
  return () => {
    if (observer != undefined) {
      linksGraph.addSub(node, observer);
    }
    updateIfNecessary(node);
    if (observer != undefined) {
      if (typeof observer.pqRank == "number") {
        if (typeof node.pqRank == "number") {
          let reAdd = observer.inPq;
          if (reAdd) {
            priorityQueue.remove(observer);
          }
          observer.pqRank = Math.max(observer.pqRank, node.pqRank + 1);
          if (reAdd) {
            priorityQueue.enqueue(observer);
          }
        }
      }
    } else if (!node.inFallbackHeap) {
      fallbackHeap.add(node);
    }
    return readValue();
  };
}
