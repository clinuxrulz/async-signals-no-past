import { createAsync, createEffect, createMemo, isPending, untrack } from "async-signals-no-past";
import { template } from "./util";

const CONTENT = {
  Uno: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
  Dos: `Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?`,
  Tres: `On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains.`,
};

function createDelay() {
  return new Promise<number>((resolve) => {
    const delay = Math.random() * 4200 + 180;
    setTimeout(() => resolve(delay), delay);
  });
}

let template1 = template(`<div class="tab-content"></div>`);
let template2 = template(`<h3></h3>`);
let template3 = template(`This content is for page "`);
let template4 = template(`" after `);
let template5 = template(`ms.`);
let template6 = template("<p></p>");

const Child = (props: { page: "Uno" | "Dos" | "Tres"; count: number }) => {
  const time = createAsync(createDelay());

  let el1 = template1() as HTMLDivElement;
  let el2 = template2();
  let el3 = document.createTextNode("");
  let el4 = template3();
  let el5 = document.createTextNode("");
  let el6 = template4();
  let el7 = document.createTextNode("");
  let el8 = template5();
  let el9 = template6();
  let el10 = document.createTextNode("");
  el1.appendChild(el2);
  el1.appendChild(el4);
  el1.appendChild(el5);
  el1.appendChild(el6);
  el1.appendChild(el7);
  el1.appendChild(el8);
  el1.appendChild(el9);
  el2.appendChild(el3);
  el9.appendChild(el10);
  let anyPending = isPending(() => props.count && props.page && time());
  createEffect(
    () => {},
    () => untrack(() => {
      createEffect(anyPending, (anyPending) => {
        if (anyPending) {
          el1.style.setProperty("display", "none");
        } else {
          el1.style.setProperty("display", "block");
        }
      });
      createEffect(() => props.count, (count) => el3.textContent = count.toString());
      createEffect(() => props.page, (page) => el5.textContent = page);
      createEffect(() => time().toFixed(), (time) => el7.textContent = time);
      createEffect(() => CONTENT[props.page], (content) => el10.textContent = content);
    })
  );
  return el1;
};

export default Child;
