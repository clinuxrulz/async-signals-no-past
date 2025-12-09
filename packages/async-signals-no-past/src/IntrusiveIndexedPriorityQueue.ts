import { IntrusiveLinkedList } from "./IntrusiveLinkedList";

export const EFFECT_QUEUE_RANK = "EffectQueue";

export type PqRank = number | (typeof EFFECT_QUEUE_RANK);

export interface InstrusivePriorityQueueElement<A> {
  pqRank(self: A): PqRank;
  setPqRank(self: A, x: PqRank): void;
  inPq(self: A): boolean;
  setInPq(self: A, x: boolean): void;
  prev(self: A): A | undefined;
  setPrev(self: A, x: A | undefined): void;
  next(self: A): A | undefined;
  setNext(self: A, x: A | undefined): void;
};

export class IntrusiveIndexedPriorityQueue<A> {
  private elementImpl: InstrusivePriorityQueueElement<A>;
  private linkedListImpl: IntrusiveLinkedList<{ head: A | undefined, tail: A | undefined, }, A>;
  private entries: {
    head: A | undefined,
    tail: A | undefined,
  }[] = new Array(1000).fill(undefined).map((_) => ({ head: undefined, tail: undefined, }));
  private last: {
    head: A | undefined,
    tail: A | undefined,
  } = {
    head: undefined,
    tail: undefined,
  };
  private minRank: number = 0;
  maxRank: number = -1;

  constructor(elementImpl: InstrusivePriorityQueueElement<A>) {
    this.elementImpl = elementImpl;
    this.linkedListImpl = new IntrusiveLinkedList<{ head: A | undefined, tail: A | undefined }, A>(
      {
        head(self) {
          return self.head;
        },
        setHead(self, x) {
          self.head = x;
        },
        tail(self) {
          return self.tail;
        },
        setTail(self, x) {
          self.tail = x;
        },
      },
      elementImpl,
    );
  }

  isEmpty(): boolean {
    if (this.minRank <= this.maxRank) {
      return false;
    }
    this.minRank = 0;
    this.maxRank = -1;
    return this.last.head == null;
  }

  enqueue(a: A) {
    if (this.elementImpl.inPq(a)) {
      return;
    }
    this.elementImpl.setInPq(a, true);
    let entry: {
      head: A | undefined,
      tail: A | undefined,
    };
    let aPqRank = this.elementImpl.pqRank(a);
    if (aPqRank == EFFECT_QUEUE_RANK) {
      entry = this.last;
    } else {
      if (aPqRank < this.minRank) {
        this.minRank = aPqRank;
      }
      if (aPqRank > this.maxRank) {
        this.maxRank = aPqRank;
      }
      entry = this.entries[aPqRank];
      if (entry == undefined) {
        this.entries[aPqRank] = {
          head: a,
          tail: a,
        };
        return;
      }
    }
    this.linkedListImpl.add(entry, a);
  }

  dequeue(): A | undefined {
    while (true) {
      if (this.minRank > this.maxRank) {
        this.minRank = 0;
        this.maxRank = -1;
        if (this.last.head != null) {
          let result = this.last.head;
          this.remove(result);
          return result;
        }
        return undefined;
      }
      let entry = this.entries[this.minRank];
      if (entry == undefined || entry.head == null) {
        this.minRank++;
        continue;
      }
      let result = entry.head;
      this.remove(result);
      while (true) {
        entry = this.entries[this.minRank];
        if (entry == undefined || entry.head == null) {
          this.minRank++;
          if (this.minRank > this.maxRank) {
            this.minRank = 0;
            this.maxRank = -1;
            break;
          }
          continue;
        }
        break;
      }
      return result;
    }
  }

  remove(a: A) {
    if (!this.elementImpl.inPq(a)) {
      return;
    }
    this.elementImpl.setInPq(a, false);
    let entry: {
      head: A | undefined,
      tail: A | undefined,
    };
    let aPqRank = this.elementImpl.pqRank(a);
    if (aPqRank == EFFECT_QUEUE_RANK) {
      entry = this.last;
    } else {
      entry = this.entries[aPqRank];
    }
    this.linkedListImpl.remove(entry, a);
  }

  changeRank(a: A, newRank: number) {
    this.remove(a);
    this.elementImpl.setPqRank(a, newRank);
    this.enqueue(a);
  }
}
