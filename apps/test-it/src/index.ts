import { createSignal, createMemo, createAsync, Accessor, NotReadyYet, createRoot, onCleanup, createEffect, } from "async-signals-no-past";

async function test1() {
  return createRoot((dispose) => {
    let onDone: () => void = () => {};
    let onDonePromise = new Promise<void>((resolve) => {
      onDone = () => {
        dispose();
        resolve();
      }
    });

    let [ a, setA, ] = createSignal(1);

    let b = createMemo(() => a() * 2);

    console.log("test no past");
    console.log(a(), b());
    setA(2);
    console.log(a(), b());
    setA(3);
    console.log(a(), b());

    console.log();
    setA(1);
    console.log("normal use");
    setTimeout(() => {
      createMemo(() => {
        console.log(a(), b());
      });
      setTimeout(() => setA(2));
      setTimeout(() => {
        setA(3);
        onDone();
      });
    });
    return onDonePromise;
  });
}

async function test2() {
  return createRoot((dispose) => {
    let onDone: () => void = () => {};
    let onDonePromise = new Promise<void>((resolve) => {
      onDone = () => {
        dispose();
        resolve();
      }
    });

    console.log("test async");
    let a = createAsync(new Promise<number>((resolve) => {
      setTimeout(
        () => {
          resolve(42);
        },
        3000
      );
    }));

    let read = <A>(a: Accessor<A>): { type: "Pending", } | { type: "Success", value: A } | { type: "Error", error: any, } => {
      try {
        return {
          type: "Success",
          value: a(),
        };
      } catch (e) {
        if (e instanceof NotReadyYet) {
          return { type: "Pending", };
        } else {
          return { type: "Error", error: e, };
        }
      }
    };

    createMemo(() => {
      onCleanup(() => console.log("memo cleanup called"));
      let val = read(a);
      console.log(val);
      if (val.type != "Pending") {
        onDone();
      }
    });
    
    return onDonePromise;
  });
}

console.log("------ Running test1 ------");
await test1();
console.log();

console.log("------ Running test2 ------");
await test2();
console.log();

console.log("------ Running test3 ------");
createRoot((dispose) => {
  let [ a, setA, ] = createSignal(1);
  let [ b, setB, ] = createSignal(2);
  let c = createMemo(() => a() + b());
  createEffect(
    () => [a(), b(), c()],
    ([a, b, c]) => {
      console.log(`${a} + ${b} = ${c}`);
    },
  );
  setTimeout(() => {
    setA(3);
    setB(4);
    setTimeout(() => {
      setA(5);
      setB(6);
      setTimeout(() => dispose());
    });
  });
});
