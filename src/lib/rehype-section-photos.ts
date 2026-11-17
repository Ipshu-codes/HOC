import type { Element, ElementContent, Root } from "hast";
import type { VFile } from "vfile";

/** One photo to show beside a list item, ready to render. */
export interface SectionPhoto {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  /** Where the photo links to (the site's photos in the gallery). */
  href: string;
}

/** Section id (the h2's {#id}) → list item number (1-based) → photo. */
export type SectionPhotos = Record<string, Record<number, SectionPhoto>>;

const SIZES = "(min-width: 48rem) 18rem, 100vw";

/**
 * rehype plugin (works on the HTML tree after markdown is converted): puts a photo beside chosen
 * items of the first numbered list in a section, e.g. the "यहाँ भएका सम्पदाहरू" / "The Heritage Here"
 * list of the Nanak Math page. Which photo goes with which item is set in content/section-photos.json.
 *
 *   <li class="has-photo">
 *     <div class="item-row">
 *       <div class="item-text">…the item's own text…</div>
 *       <a class="item-photo" href="…"><img …></a>
 *     </div>
 *   </li>
 *
 * Text comes first, so phones show the text with the photo underneath (and screen readers read the
 * item before its photo); from 768 px the text is on the left and the photo on the right, the same
 * for every item (styles in globals.css, .heritage-prose). A missing section or item number fails
 * the build.
 */
export default function rehypeSectionPhotos(options: { photos: SectionPhotos }) {
  return (tree: Root, file: VFile) => {
    for (const [sectionId, items] of Object.entries(options.photos)) {
      const list = firstListInSection(tree, sectionId);
      if (!list) {
        file.fail(`content/section-photos.json: no numbered list found in section #${sectionId}`);
        return;
      }
      const lis = list.children.filter((child): child is Element => child.type === "element" && child.tagName === "li");
      for (const [number, photo] of Object.entries(items)) {
        const li = lis[Number(number) - 1];
        if (!li) {
          file.fail(`content/section-photos.json: #${sectionId} has no list item ${number} (it has ${lis.length})`);
          return;
        }
        wrap(li, photo);
      }
    }
  };
}

/** The first <ol> after <h2 id={sectionId}>, before the next <h2>. */
function firstListInSection(tree: Root, sectionId: string): Element | null {
  let inSection = false;
  for (const node of tree.children) {
    if (node.type !== "element") continue;
    if (node.tagName === "h2") inSection = node.properties.id === sectionId;
    else if (inSection && node.tagName === "ol") return node;
  }
  return null;
}

function wrap(li: Element, photo: SectionPhoto) {
  const image: Element = {
    type: "element",
    tagName: "img",
    properties: {
      src: photo.src,
      srcSet: photo.srcSet,
      sizes: SIZES,
      width: photo.width,
      height: photo.height,
      alt: photo.alt,
      loading: "lazy",
      decoding: "async",
    },
    children: [],
  };
  const link: Element = {
    type: "element",
    tagName: "a",
    properties: { className: ["item-photo"], href: photo.href },
    children: [image],
  };
  const text: Element = { type: "element", tagName: "div", properties: { className: ["item-text"] }, children: li.children };
  const row: Element = { type: "element", tagName: "div", properties: { className: ["item-row"] }, children: [text, link] };
  li.properties = { ...li.properties, className: ["has-photo"] };
  li.children = [row] as ElementContent[];
}
