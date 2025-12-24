/*
import { createSignal, onCleanup } from 'solid-js';

export default function Loader(props: { message?: string }) {
  const [count, setCount] = createSignal(0),
    interval = setInterval(() => setCount((c) => (c + 1) % 4), 150);
  onCleanup(() => clearInterval(interval));

  return (
    <div class="loader">
      Loading {props.message} {Array.from(new Array(count()), () => '.')}
    </div>
  );
}
*/