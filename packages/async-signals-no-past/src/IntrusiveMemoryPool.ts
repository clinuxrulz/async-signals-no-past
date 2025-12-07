export interface IntrusiveMemoryPoolItem<A> {
  create(): A;
  clean(a: A): void;
  next(a: A): A | undefined;
  setNext(a: A, x: A | undefined): void;
}

export class IntrusiveMemoryPool<A> {
  itemImpl: IntrusiveMemoryPoolItem<A>;
  head: A | undefined = undefined;
  tail: A | undefined = undefined;

  constructor(
    itemImpl: IntrusiveMemoryPoolItem<A>,
    initSize: number,
  ) {
    this.itemImpl = itemImpl;
    for (let i = 0; i < initSize; ++i) {
      let a = itemImpl.create();
      if (this.head == undefined) {
        this.head = this.tail = a;
      } else {
        itemImpl.setNext(this.tail!, a);
        this.tail = a;
      }
    }
  }

  alloc(): A {
    if (this.head == undefined) {
      return this.itemImpl.create();
    }
    let result = this.head;
    this.head = this.itemImpl.next(this.head);
    if (this.head == undefined) {
      this.tail = undefined;
    }
    this.itemImpl.setNext(result, undefined);
    return result;
  }

  free(a: A): void {
    this.itemImpl.clean(a);
    if (this.head == undefined) {
      this.head = this.tail = a;
    } else {
      this.itemImpl.setNext(this.tail!, a);
      this.tail = a;
    }
  }
}
