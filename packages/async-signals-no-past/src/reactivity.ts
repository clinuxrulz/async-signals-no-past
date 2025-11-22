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
