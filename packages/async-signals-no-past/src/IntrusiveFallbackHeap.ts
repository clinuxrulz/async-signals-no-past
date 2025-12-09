import { IntrusiveLinkedList } from "./IntrusiveLinkedList";

export interface IntrusiveFallbackHeapElement<A> {
  inFallbackHeap(self: A): boolean;
  setInFallbackHeap(self: A, x: boolean): void;
  prev(self: A): A | undefined;
  setPrev(self: A, x: A | undefined): void;
  next(self: A): A | undefined;
  setNext(self: A, x: A | undefined): void;
}

export class FallbackHeap<A> {
  elementImpl: IntrusiveFallbackHeapElement<A>;
  linkedListImpl: IntrusiveLinkedList<FallbackHeap<A>,A>;
  head: A | undefined = undefined;
  tail: A | undefined = undefined;

  constructor(elementImpl: IntrusiveFallbackHeapElement<A>) {
    this.elementImpl = elementImpl;
    this.linkedListImpl = new IntrusiveLinkedList<FallbackHeap<A>,A>(
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
    return this.linkedListImpl.isEmpty(this);
  }

  add(a: A) {
    if (this.elementImpl.inFallbackHeap(a)) {
      return;
    }
    this.elementImpl.setInFallbackHeap(a, true);
    this.linkedListImpl.add(this, a);
  }

  remove(a: A) {
    if (!this.elementImpl.inFallbackHeap(a)) {
      return;
    }
    this.elementImpl.setInFallbackHeap(a, false);
    this.linkedListImpl.remove(this, a);
  }

  pop(): A | undefined {
    let result = this.linkedListImpl.pop(this);
    if (result == undefined) {
      return undefined;
    }
    this.elementImpl.setInFallbackHeap(result, false);
    return result;
  }
}
