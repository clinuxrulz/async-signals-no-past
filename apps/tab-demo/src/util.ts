import { Accessor, createEffect, createMemo, isPending } from "async-signals-no-past";

export function template(html: string): () => Node {
  const template = document.createElement('template');
  template.innerHTML = html;
  let node = template.content.firstElementChild as Node;
  if (node == null) {
    node = document.createTextNode(html);
  }
  return () => node.cloneNode(true) as Node;
}

export function Loading(props: {
  fallback: Node,
  child: Node,
}): Node {
  let child = props.child;
  let pending = makeIsPending$();
  let div = document.createElement("div");
  createEffect(
    pending,
    (pending) => {
      while (div.firstChild != null) {
        div.removeChild(div.firstChild);
      }
      if (pending) {
        div.appendChild(props.fallback);
      } else {
        div.appendChild(child);
      }
    }
  );
  return div;
}

let isPendingAccessorList: Accessor<boolean>[] = [];

export function renderEffect$<A>(pureFn: () => A, effectFn: (a: A) => void) {
  let pure = createMemo(pureFn);
  isPendingAccessorList.push(isPending(pure));
  createEffect(
    pure,
    effectFn,
  );
}

export function makeIsPending$(): Accessor<boolean> {
  if (isPendingAccessorList.length == 0) {
    return () => false;
  }
  let tmp = isPendingAccessorList;
  isPendingAccessorList = [];
  return createMemo(() => tmp.some((x) => x()));
}
