export interface IntrusiveLinkedListElement<A> {
  inLinkedList: (self: A) => boolean,
  setInLinkedList: (self: A, x: boolean) => void,
  prev: (self: A) => A | undefined,
  setPrev: (self: A, x: A | undefined) => void,
  next: (self: A) => A | undefined,
  setNext: (self: A, x: A | undefined) => void,
}

export class IntrusiveLinkedList<A> {
  elementImpl: IntrusiveLinkedListElement<A>;
  head: A | undefined = undefined;
  tail: A | undefined = undefined;

  constructor(elementImpl: IntrusiveLinkedListElement<A>) {
    this.elementImpl = elementImpl;
  }

  isEmpty(): boolean {
    return this.head === undefined;
  }

  add(a: A) {
    if (this.elementImpl.inLinkedList(a)) {
      return;
    }
    this.elementImpl.setInLinkedList(a, true);
    if (this.head === undefined) {
      this.head = this.tail = a;
      return;
    }
    this.elementImpl.setNext(this.tail!, a);
    this.elementImpl.setPrev(a, this.tail);
    this.tail = a;
  }

  remove(a: A) {
    if (!this.elementImpl.inLinkedList(a)) {
      return;
    }
    this.elementImpl.setInLinkedList(a, false);
    if (this.elementImpl.prev(a) === undefined) {
      this.head = this.elementImpl.next(this.head!);
      if (this.head !== undefined) {
        this.elementImpl.setPrev(this.head, undefined);
      }
    } else {
      this.elementImpl.setNext(this.elementImpl.prev(a)!, this.elementImpl.next(a));
    }
    if (this.elementImpl.next(a) === undefined) {
      this.tail = this.elementImpl.prev(this.tail!);
      if (this.tail !== undefined) {
        this.elementImpl.setNext(this.tail, undefined);
      }
    }
    this.elementImpl.setPrev(a, undefined);
    this.elementImpl.setNext(a, undefined);
  }

  pop(): A | undefined {
    if (this.head === undefined) {
      return undefined;
    }
    let result = this.head;
    this.head = this.elementImpl.next(this.head);
    if (this.head === undefined) {
      this.tail = undefined;
    } else {
      this.elementImpl.setPrev(this.head, undefined);
    }
    this.elementImpl.setPrev(result, undefined);
    this.elementImpl.setNext(result, undefined);
    return result;
  }
}

