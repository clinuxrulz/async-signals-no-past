export interface IntrusiveFallbackHeapElement<A> {
  inFallbackHeap: boolean,
  fhPrev: A | null,
  fhNext: A | null,
}

export class FallbackHeap<A extends IntrusiveFallbackHeapElement<A>> {
  head: A | null = null;
  tail: A | null = null;

  isEmpty(): boolean {
    return this.head == null;
  }

  add(a: A) {
    if (a.inFallbackHeap) {
      return;
    }
    a.inFallbackHeap = true;
    if (this.head == null) {
      this.head = this.tail = a;
      return;
    }
    this.tail!.fhNext = a;
    a.fhPrev = this.tail;
    this.tail = a;
  }

  remove(a: A) {
    if (!a.inFallbackHeap) {
      return;
    }
    a.inFallbackHeap = false;
    if (a.fhPrev == null) {
      this.head = this.head!.fhNext;
      if (this.head != null) {
        this.head.fhPrev = null;
      }
    } else {
      a.fhPrev.fhNext = a.fhNext;
    }
    if (a.fhNext == null) {
      this.tail = this.tail!.fhPrev;
      if (this.tail != null) {
        this.tail.fhNext = null;
      }
    }
    a.fhPrev = a.fhNext = null;
  }

  pop(): A | undefined {
    if (this.head == null) {
      return undefined;
    }
    let result = this.head;
    this.head = this.head.fhNext;
    if (this.head == null) {
      this.tail = null;
    } else {
      this.head.fhPrev = null;
    }
    result.fhPrev = null;
    result.fhNext = null;
    return result;
  }
}

