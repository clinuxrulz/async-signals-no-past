import { createSignal, createMemo, } from "async-signals-no-past";

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
  setTimeout(() => setA(3));
});
