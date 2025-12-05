import { ElementInterface, IntrusiveIndexedPriorityQueue, PqRank } from "./IntrusiveIndexedPriorityQueue";

const enum ReactiveFlags {
  None = 0,
  Dirty = 1 << 0,
  RecomputingDeps = 1 << 1,
  InHeap = 1 << 2,
  InFallbackHeap = 1 << 3,
}

export enum NodeUpdateResult {
  SEIZE_FIRE,
  FIRE,
}

export type NodeUpdateFn = () => NodeUpdateResult;

export interface Link {
  dep: Node;
  sub: Node;
  nextDep: Link | null;
  prevSub: Link | null;
  nextSub: Link | null;
}

export class Node implements ElementInterface<Node> {
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

  pqPrev: Node | null = null;
  pqNext: Node | null = null;
  subs: Link | null = null;
  subsTail: Link | null = null;
  deps: Link | null = null;
  depsTail: Link | null = null;
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

export const priorityQueue = new IntrusiveIndexedPriorityQueue<Node>();
export let owner: Node | undefined = undefined;
export let observer: Node | undefined = undefined;

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

function withObserver<A>(innerObserver: Node, k: () => A): A {
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
    let oldRank = node.pqRank;
    let result = node.update();
    let newRank = node.pqRank;
    if (typeof oldRank === "number" && typeof newRank === "number") {
      if (newRank > oldRank) {
        fixRanksOfSubs(node);
      }
    }
    if (result == NodeUpdateResult.FIRE) {
      for (let sub = node.subs; sub != null; sub = sub.nextSub) {
        priorityQueue.enqueue(sub.sub);
      }
    }
  }
}

function fixRanksOfSubs(node: Node) {
  let rank = node.pqRank;
  if (typeof rank !== "number") {
    return;
  }
  for (let sub = node.subs; sub != null; sub = sub.nextSub) {
    if (typeof sub.sub.pqRank !== "number") {
      continue;
    }
    if (sub.sub.pqRank <= rank) {
      sub.sub.pqRank = rank + 1;
      fixRanksOfSubs(sub.sub);
    }
  }
}

export function createSignal<A>(a: A): Signal<A> {
  let value: A = a;
  let node = new Node(() => NodeUpdateResult.FIRE);
  let accessor: Accessor<A> = () => {
    if (observer != undefined) {
      link(node, observer);
    }
    return value;
  };
  let setter: Setter<A> = (x: A) => {
    value = x;
    priorityQueue.enqueue(node);
    requestFlush();
  };
  return [ accessor, setter, ];
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
    while (node.deps != null) {
      node.deps = unlinkSubs(node.deps);
    }
    node.depsTail = null;
    return fn();
  });
  let value: A = updateFn();
  return () => {
    if (observer != undefined) {
      if (typeof observer.pqRank == "number") {
        if (typeof node.pqRank == "number") {
          observer.pqRank = Math.max(observer.pqRank, node.pqRank + 1);
        }
      }
      link(node, observer);
    }
    return value;
  };
}

function unlinkSubs(link: Link): Link | null {
  const dep = link.dep;
  const nextDep = link.nextDep;
  const nextSub = link.nextSub;
  const prevSub = link.prevSub;
  if (nextSub !== null) {
    nextSub.prevSub = prevSub;
  } else {
    dep.subsTail = prevSub;
  }
  if (prevSub !== null) {
    prevSub.nextSub = nextSub;
  } else {
    dep.subs = nextSub;
    if (nextSub === null && "fn" in dep) {
      unwatched(dep);
    }
  }
  return nextDep;
}

function unwatched(el: Node) {
  priorityQueue.remove(el);
  let dep = el.deps;
  while (dep !== null) {
    dep = unlinkSubs(dep);
  }
  el.deps = null;
  el.dispose();
}

// https://github.com/stackblitz/alien-signals/blob/v2.0.3/src/system.ts#L52
function link(
  dep: Node,
  sub: Node,
) {
  const prevDep = sub.depsTail;
  if (prevDep !== null && prevDep.dep === dep) {
    return;
  }
  let nextDep: Link | null = null;
  const isRecomputing = sub.flags & ReactiveFlags.RecomputingDeps;
  if (isRecomputing) {
    nextDep = prevDep !== null ? prevDep.nextDep : sub.deps;
    if (nextDep !== null && nextDep.dep === dep) {
      sub.depsTail = nextDep;
      return;
    }
  }

  const prevSub = dep.subsTail;
  if (
    prevSub !== null &&
    prevSub.sub === sub &&
    (!isRecomputing || isValidLink(prevSub, sub))
  ) {
    return;
  }
  const newLink =
    (sub.depsTail =
      dep.subsTail =
      {
        dep,
        sub,
        nextDep,
        prevSub,
        nextSub: null,
      });
  if (prevDep !== null) {
    prevDep.nextDep = newLink;
  } else {
    sub.deps = newLink;
  }
  if (prevSub !== null) {
    prevSub.nextSub = newLink;
  } else {
    dep.subs = newLink;
  }
}

// https://github.com/stackblitz/alien-signals/blob/v2.0.3/src/system.ts#L284
function isValidLink(checkLink: Link, sub: Node): boolean {
  const depsTail = sub.depsTail;
  if (depsTail !== null) {
    let link = sub.deps!;
    do {
      if (link === checkLink) {
        return true;
      }
      if (link === depsTail) {
        break;
      }
      link = link.nextDep!;
    } while (link !== null);
  }
  return false;
}
