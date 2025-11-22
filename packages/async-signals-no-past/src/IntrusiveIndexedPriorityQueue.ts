// For checking that I have not lost my marbles
const SANITY_CHECKS = false;

export const EFFECT_QUEUE_RANK = "EffectQueue";

export type PqRank = number | (typeof EFFECT_QUEUE_RANK);

export type ElementInterface<A> = {
  pqRank: PqRank,
  inPq: boolean,
  pqPrev: A | null,
  pqNext: A | null,
};

export class IntrusiveIndexedPriorityQueue<
  A extends ElementInterface<A>
> {
  private entries: {
    head: A | null,
    tail: A | null,
  }[] = new Array(1000).fill(undefined).map((_) => ({ head: null, tail: null, }));
  private last: {
    head: A | null,
    tail: A | null,
  } = {
    head: null,
    tail: null,
  };
  private minRank: number = 0;
  maxRank: number = -1;

  private checkQueue() {
    for (let i = 0; i < this.entries.length; ++i) {
      let expectedPqRank = i;
      let e = this.entries[i];
      if (e == undefined) {
        continue;
      }
      if (e.head != null && e.head.pqPrev != null) {
        throw new Error("PQ");
      }
      if (e.tail != null && e.tail.pqNext != null) {
        throw new Error("PQ");
      }
      let at = e.head;
      while (at != null) {
        if (at.pqRank !== expectedPqRank) {
          throw new Error("PQ");
        }
        if (!at.inPq) {
          throw new Error("PQ");
        }
        at = at.pqNext;
      }
    }
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
    if (a.pqRank != (a as any).rank.rank) {
      throw new Error("PQ");
    }
    if (a.inPq) {
      return;
    }
    a.inPq = true;
    let entry: {
      head: A | null,
      tail: A | null,
    };
    if (a.pqRank == EFFECT_QUEUE_RANK) {
      entry = this.last;
    } else {
      if (a.pqRank < this.minRank) {
        this.minRank = a.pqRank;
      }
      if (a.pqRank > this.maxRank) {
        this.maxRank = a.pqRank;
      }
      entry = this.entries[a.pqRank];
      if (entry == undefined) {
        this.entries[a.pqRank] = {
          head: a,
          tail: a,
        };
        if (SANITY_CHECKS) {
          this.checkQueue();
        }
        return;
      }
    }
    if (entry.head == null) {
      entry.head = entry.tail = a;
      if (SANITY_CHECKS) {
        this.checkQueue();
      }
      return;
    }
    entry.tail!.pqNext = a;
    a.pqPrev = entry.tail!;
    entry.tail = a;
    if (SANITY_CHECKS) {
      this.checkQueue();
    }
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
        if (SANITY_CHECKS) {
          this.checkQueue();
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
      if (SANITY_CHECKS) {
        // sanity check, find it there is something else with a smaller rank
        for (let entry of this.entries) {
          if (entry != undefined) {
            let at = entry.head;
            while (at != null) {
              if (at.pqRank < result.pqRank) {
                throw new Error("priority queue failed");
              }
              at = at.pqNext;
            }
          }
        }
        this.checkQueue();
      }
      return result;
    }
  }

  remove(a: A) {
    if (!a.inPq) {
      return;
    }
    a.inPq = false;
    let entry: {
      head: A | null,
      tail: A | null,
    };
    if (a.pqRank == EFFECT_QUEUE_RANK) {
      entry = this.last;
    } else {
      entry = this.entries[a.pqRank];
    }
    if (a.pqPrev !== null) {
      a.pqPrev.pqNext = a.pqNext;
    }
    if (a.pqNext !== null) {
      a.pqNext.pqPrev = a.pqPrev;
    }
    if (entry.head == a) {
      entry.head = entry.head.pqNext;
    }
    if (entry.tail == a) {
      entry.tail = entry.tail.pqPrev;
    }
    if (entry.head == null) {
      entry.tail = null;
    }
    a.pqNext = null;
    a.pqPrev = null;
    if (SANITY_CHECKS) {
      this.checkQueue();
      // sanity check
      {
        let at = entry.head;
        while (at != null) {
          if (!at.inPq) {
            throw new Error("PQ");
          }
          at = at.pqNext;
        }
      }
      //
    }
  }

  changeRank(a: A, newRank: number) {
    this.remove(a);
    a.pqRank = newRank;
    this.enqueue(a);
  }
}