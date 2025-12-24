import { createEffect, createSignal, onCleanup } from "async-signals-no-past";
import { renderEffect$, template } from "./util";

let template1 = template(`<div class="loader"></div>`);
let template2 = template(`Loading `);
let template3 = template(` `);

export default function Loader(props: { message?: string }) {
  const [count, setCount] = createSignal(0);
  const interval = setInterval(() => setCount((count() + 1) % 4), 150.0);
  onCleanup(() => clearInterval(interval));
  let el1 = template1();
  let el2 = template2();
  let el3 = document.createTextNode("");
  let el4 = template3();
  let el5 = document.createTextNode("");
  el1.appendChild(el2);
  el1.appendChild(el3);
  el1.appendChild(el4);
  el1.appendChild(el5);
  createEffect(
    () => {},
    () => {
      renderEffect$(() => props.message, (message) => {
        el3.textContent = message ?? "";
      });
      renderEffect$(count, (count) => {
        el5.textContent = Array.from(new Array(count), () => '.').join("");
      });
    },
  );
  return el1;
}
