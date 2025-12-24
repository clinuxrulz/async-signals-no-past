export function template(html: string): () => Node {
  const template = document.createElement('template');
  template.innerHTML = html;
  let node = template.content.firstElementChild as Node;
  if (node == null) {
    node = document.createTextNode(html);
  }
  return () => node.cloneNode(true) as Node;
}
