import type { Root } from "mdast";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

// Matches a trailing "{#history}" on a heading line.
const ID_SUFFIX = /\s*\{#([a-z0-9-]+)\}\s*$/;

/**
 * remark plugin: `## इतिहास {#history}` → `<h2 id="history">इतिहास</h2>`.
 *
 * Every h2/h3 must carry an explicit English id so that anchors such as
 * /ne/heritage/nanak-math/#history work in both languages (an id generated
 * from the Nepali text would differ per language). A missing id fails the build.
 */
export default function remarkHeadingIds() {
  return (tree: Root, file: VFile) => {
    visit(tree, "heading", (node) => {
      if (node.depth !== 2 && node.depth !== 3) return;

      const last = node.children.at(-1);
      const match = last?.type === "text" ? last.value.match(ID_SUFFIX) : null;
      if (!last || last.type !== "text" || !match) {
        file.fail(`Heading "${toString(node)}" needs a stable id, e.g. "## History {#history}"`, node);
      }

      last.value = last.value.slice(0, match.index);
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id: match[1] } };
    });
  };
}
