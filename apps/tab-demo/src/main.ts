import { createRoot, createSignal } from "async-signals-no-past";
import Child from "./Child";
import ChildWithLoading from "./ChildWithLoading";

let [ count, setCount, ] = createSignal(0);
let x = 0;
window.setInterval(() => setCount(x++), 200);

let app = document.getElementById("app")!;
let dispose = createRoot((dispose) => {
  app.appendChild(
    ChildWithLoading({
      page: "Uno",
      get count() {
        return count();
      },
    })
  );
  return dispose;
});
/*
import { createEffect, createSignal, onCleanup } from "async-signals-no-past";


import { render } from '@solidjs/web';
import { Switch, Match, createSignal, Loading, isPending } from 'solid-js';

import Child from './Child.js';
import ChildWithLoading from './ChildWithLoading.js';
import Loader from './Loader.js';

const App = () => {
  const [tab, setTab] = createSignal(0);
  const [count, setCount] = createSignal(0);
  setInterval(() => setCount((c) => c + 1), 200);

  return (
    <>
      <ul class="inline">
        <li class={{ selected: tab() === 0 }} onClick={() => setTab(0)}>
          Uno
        </li>
        <li class={{ selected: tab() === 1 }} onClick={() => setTab(1)}>
          Dos
        </li>
        <li class={{ selected: tab() === 2 }} onClick={() => setTab(2)}>
          Tres
        </li>
      </ul>
      <div class={['tab', { pending: isPending(tab) }]}>
        <Loading fallback={<Loader />}>
          <Switch>
            <Match when={tab() === 0}>
              <Child page="Uno" count={count()} />
            </Match>
            <Match when={tab() === 1}>
              <Child page="Dos" count={count()} />
            </Match>
            <Match when={tab() === 2}>
              <ChildWithLoading page="Tres" count={count()} />
            </Match>
          </Switch>
        </Loading>
      </div>
    </>
  );
};

render(App, document.getElementById('app'));
*/