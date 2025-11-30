import { createSignal, createMemo, } from "async-signals-no-past";

let [ a, setA, ] = createSignal(1);

let b = createMemo(() => a() * 2);

createMemo(() => {
    console.log(a(), b());
});
setTimeout(() => setA(2));
setTimeout(() => setA(3));
