export interface IntrusiveLinkedListData<Self,A> {
  head: (self: Self) => A | undefined,
  setHead: (self: Self, x: A | undefined) => void,
  tail: (self: Self) => A | undefined,
  setTail: (self: Self, x: A | undefined) => void,
}

export interface IntrusiveLinkedListElement<A> {
  prev: (self: A) => A | undefined,
  setPrev: (self: A, x: A | undefined) => void,
  next: (self: A) => A | undefined,
  setNext: (self: A, x: A | undefined) => void,
}

export class IntrusiveLinkedList<Self,A> {
  dataImpl: IntrusiveLinkedListData<Self,A>;
  elementImpl: IntrusiveLinkedListElement<A>;

  constructor(
    dataImpl: IntrusiveLinkedListData<Self,A>,
    elementImpl: IntrusiveLinkedListElement<A>
  ) {
    this.dataImpl = dataImpl;
    this.elementImpl = elementImpl;
  }

  isEmpty(self: Self): boolean {
    return this.dataImpl.head(self) === undefined;
  }

  add(self: Self, a: A) {
    if (this.dataImpl.head(self) === undefined) {
      this.dataImpl.setHead(self, a);
      this.dataImpl.setTail(self, a);
      return;
    }
    this.elementImpl.setNext(this.dataImpl.tail(self)!, a);
    this.elementImpl.setPrev(a, this.dataImpl.tail(self));
    this.dataImpl.setTail(self, a);
  }

  remove(self: Self, a: A) {
    if (this.elementImpl.prev(a) === undefined) {
      this.dataImpl.setHead(
        self,
        this.elementImpl.next(
          this.dataImpl.head(self)!
        ),
      );
      if (this.dataImpl.head(self) !== undefined) {
        this.elementImpl.setPrev(
          this.dataImpl.head(self)!,
          undefined,
        );
      }
    } else {
      this.elementImpl.setNext(this.elementImpl.prev(a)!, this.elementImpl.next(a));
    }
    if (this.elementImpl.next(a) === undefined) {
      this.dataImpl.setTail(
        self,
        this.elementImpl.prev(
          this.dataImpl.tail(self)!
        ),
      );
      if (this.dataImpl.tail(self) !== undefined) {
        this.elementImpl.setNext(
          this.dataImpl.tail(self)!,
          undefined,
        );
      }
    }
    this.elementImpl.setPrev(a, undefined);
    this.elementImpl.setNext(a, undefined);
  }

  pop(self: Self): A | undefined {
    if (this.dataImpl.head(self) === undefined) {
      return undefined;
    }
    let result = this.dataImpl.head(self)!;
    this.dataImpl.setHead(
      self,
      this.elementImpl.next(
        this.dataImpl.head(self)!
      ),
    );
    if (this.dataImpl.head(self) === undefined) {
      this.dataImpl.setTail(self, undefined);
    } else {
      this.elementImpl.setPrev(
        this.dataImpl.head(self)!,
        undefined,
      );
    }
    this.elementImpl.setPrev(result, undefined);
    this.elementImpl.setNext(result, undefined);
    return result;
  }
}

