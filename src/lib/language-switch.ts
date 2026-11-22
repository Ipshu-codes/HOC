import { useEffect, useRef } from "react";

import type { WorldPose } from "@/lib/museum-world";

/**
 * Switching language keeps the visitor where they were.
 *
 * /en/… and /ne/… share the root layout, so the switch is a client-side navigation (no page reload),
 * but Next.js mounts the whole [lang] tree afresh for the new language: the open panel, the museum
 * and the gallery would start over (panel scrolled to the top, museum back at its intro, photo
 * closed). So, just before the language link navigates, each of them writes down what matters here,
 * and its new copy in the other language reads it back on its first render. The note lives in
 * memory only (this module), is for the page being switched to, and expires after a few seconds.
 */
export interface LanguageCarry {
  /** The open panel's scroll (see panelPosition). */
  panel?: PanelPosition;
  /** The 3D museum: past its intro, where the camera stood, which picture was open (by file). */
  museum?: { started?: boolean; pose?: WorldPose; photo?: string | null; display?: "map" | "logo" | null };
  /** The gallery: its site filter and the photo open in the photo view (photos by file). */
  gallery?: { filter: string; photo: string | null };
}

type Saver = (carry: LanguageCarry) => void;

const savers = new Set<Saver>();
let note: { path: string; at: number; carry: LanguageCarry } | null = null;
const LIFETIME_MS = 8000;

/** "/ne/about" for "/ne/about/" or "/ne/about/#history". */
function normalise(path: string): string {
  const bare = path.split(/[?#]/)[0];
  return bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
}

/** The language link calls this as it is followed, with the page it leads to. */
export function carryLanguageSwitch(toPath: string): void {
  const carry: LanguageCarry = {};
  savers.forEach((save) => save(carry));
  note = { path: normalise(toPath), at: Date.now(), carry };
}

/** What was carried to `path`, if the visitor just switched language to it (does not use it up). */
export function carriedTo(path: string): LanguageCarry | null {
  if (!note || Date.now() - note.at > LIFETIME_MS || note.path !== normalise(path)) return null;
  return note.carry;
}

/** Used once restored, so leaving and reopening the page later starts normally. */
export function forgetCarried(key: keyof LanguageCarry): void {
  if (note) delete note.carry[key];
}

/** Registers what a component hands over when the language switches (latest render's closure). */
export function useLanguageCarry(save: Saver): void {
  const latest = useRef(save);
  useEffect(() => {
    latest.current = save;
  });
  useEffect(() => {
    const call: Saver = (carry) => latest.current(carry);
    savers.add(call);
    return () => {
      savers.delete(call);
    };
  }, []);
}

/** Where a scrolled panel is: the last section heading above its top edge (h2/h3 ids are the same
 *  in English and Nepali) and how far through that section, as a share of its height, so the other
 *  language's longer or shorter text lands at the same point. `top` is used when there is none. */
export interface PanelPosition {
  anchor: string | null;
  ratio: number;
  top: number;
}

function sections(body: HTMLElement): HTMLElement[] {
  return Array.from(body.querySelectorAll<HTMLElement>("h2[id], h3[id]"));
}

export function panelPosition(body: HTMLElement): PanelPosition {
  const edge = body.getBoundingClientRect().top;
  const heads = sections(body);
  let at = -1;
  heads.forEach((head, index) => {
    if (head.getBoundingClientRect().top <= edge + 1) at = index;
  });
  if (at < 0) return { anchor: null, ratio: 0, top: body.scrollTop };
  const start = heads[at].getBoundingClientRect().top;
  const end = heads[at + 1]?.getBoundingClientRect().top ?? start + Math.max(1, body.scrollHeight - (start - edge + body.scrollTop));
  return { anchor: heads[at].id, ratio: Math.min(1, (edge - start) / Math.max(1, end - start)), top: body.scrollTop };
}

export function restorePanelPosition(body: HTMLElement, position: PanelPosition): void {
  const heads = sections(body);
  const at = position.anchor ? heads.findIndex((head) => head.id === position.anchor) : -1;
  if (at < 0) {
    body.scrollTop = position.top;
    return;
  }
  const edge = body.getBoundingClientRect().top;
  const start = heads[at].getBoundingClientRect().top;
  const end = heads[at + 1]?.getBoundingClientRect().top ?? start + Math.max(1, body.scrollHeight - (start - edge + body.scrollTop));
  body.scrollTop += start - edge + position.ratio * (end - start);
}
