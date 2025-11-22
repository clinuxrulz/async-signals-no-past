import { ElementInterface, IntrusiveIndexedPriorityQueue, PqRank } from "./IntrusiveIndexedPriorityQueue";

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
  pqRank: PqRank = 0;
  inPq: boolean = false;
  pqPrev: Node | null = null;
  pqNext: Node | null = null;
  subs: Link | null = null;
  subsTail: Link | null = null;
  update: NodeUpdateFn;

  constructor(
    update: NodeUpdateFn
  ) {
    this.update = update;
  }
}

export const priorityQueue = new IntrusiveIndexedPriorityQueue<Node>();
