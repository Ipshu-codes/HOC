import type { Element, ElementContent, Root } from "hast";

/** Section id (the h2's {#id}) → the row style its lists get (styles in globals.css, .heritage-prose). */
const SECTIONS: Record<string, string> = {
  festivals: "rows-festivals", // like an exhibition list: big title left, the rest on the right
  "how-to-visit": "rows-steps", // numbered steps (the number is CSS, not text)
};

/**
 * rehype plugin: lays out the lists of two heritage-page sections as rows (the UI match, Biegajaca's
 * exhibitions list and "how it works" steps). It only regroups what is there, never the words:
 *
 *   <li><strong>Where:</strong> on a small wooded hill …</li>
 *   →
 *   <li><span class="row-title"><strong>Where:</strong></span><div class="row-rest"> on a small wooded hill …</div></li>
 *
 * An item that does not start with a bold label keeps its content in one cell (class "row-plain").
 * Only lists directly inside the section (not nested sub-lists) are changed.
 */
export default function rehypeListRows() {
  return (tree: Root) => {
    let rowClass: string | null = null;
    for (const node of tree.children) {
      if (node.type !== "element") continue;
      if (node.tagName === "h2") {
        rowClass = SECTIONS[String(node.properties.id ?? "")] ?? null;
        continue;
      }
      if (!rowClass || (node.tagName !== "ul" && node.tagName !== "ol")) continue;
      node.properties = { ...node.properties, className: [rowClass] };
      for (const li of node.children) {
        if (li.type === "element" && li.tagName === "li") splitItem(li);
      }
    }
  };
}

function isBlank(node: ElementContent): boolean {
  return node.type === "text" && node.value.trim() === "";
}

function splitItem(li: Element) {
  const firstIndex = li.children.findIndex((child) => !isBlank(child));
  const first = li.children[firstIndex];
  if (!first || first.type !== "element" || first.tagName !== "strong") {
    li.properties = { ...li.properties, className: ["row-plain"] };
    li.children = [{ type: "element", tagName: "div", properties: { className: ["row-rest"] }, children: li.children }];
    return;
  }
  const title: Element = { type: "element", tagName: "span", properties: { className: ["row-title"] }, children: [first] };
  const rest: Element = {
    type: "element",
    tagName: "div",
    properties: { className: ["row-rest"] },
    children: li.children.slice(firstIndex + 1),
  };
  li.children = [title, rest];
}
