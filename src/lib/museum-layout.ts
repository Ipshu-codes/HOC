import { formatNumber } from "@/lib/format";
import type { GalleryPhoto } from "@/lib/images";
import type { Locale } from "@/types/locale";

/**
 * Pure layout for the gallery's 3D museum. No Three.js imports here: this module describes one
 * gently curved exhibition hall in metres, so it can be reasoned about without a renderer. Words
 * are never invented here: the marker text is the site number and name already rendered by the
 * gallery DOM.
 */

export type Vec3 = [number, number, number];

/** A frame's on-screen box, used only to place the shared photo view's FLIP source. */
export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Narrower hall for phones/tablets; same path, just scaled to a smaller screen. */
export const COMPACT_CORRIDOR_WIDTH = 7.6;

export const MUSEUM = {
  corridorWidth: 10.4,
  corridorHeight: 4.6,
  wallThickness: 0.24,
  /** The entrance is an open threshold; the shell continues this far behind the camera. */
  entryOverhang: 3.2,
  eyeHeight: 1.65,
  /** Larger prints are hung a little higher so the label below still clears the floor. */
  artCentreY: 2.32,
  /** Site plaques stay at their original absolute height whichever artwork size is built. */
  markerCentreY: 3.09,
  /** Bigger prints get longer slots: the hall extends instead of crowding neighbouring works. */
  artSpacing: 3.6,
  siteGap: 2.4,
  startInset: 4.4,
  endInset: 4.2,
  minLength: 32,
  /** Gentle constant curvature: at most ~1° per 3m, and never more than ~52° across the hall. */
  maxCurvature: 0.018,
  maxTurn: 0.9,
  /** Shell resolution; artwork/marker positions are also inserted as exact sample points. */
  shellSampleStep: 0.6,
  /** Photograph height; width is 2.05 × the photo's own aspect ratio (≈1.38–2.93 m here). */
  artHeight: 2.05,
  minArtWidth: 1.35,
  maxArtWidth: 3.5,
  matBorder: 0.16,
  frameBorder: 0.09,
  frameDepth: 0.1,
  plaqueWidth: 1.9,
  plaqueHeight: 0.78,
  plaqueDepth: 0.06,
  /** Wall-facing caption panel below each frame. Width follows the frame; the face texture wraps
   *  EN/NE text and shrinks its type if an unusually long description needs it. */
  descriptionGap: 0.1,
  descriptionHeight: 0.44,
  descriptionMinWidth: 2.7,
  descriptionMaxWidth: 3.7,
  descriptionDepth: 0.03,
  walkRadius: 0.36,
  frameClearance: 0.14,
} as const;

/** The mount front sits just inside the wall face; the rest of the frame rests in the wall. */
const MOUNT_CLEARANCE = 0.012;

/** Arc-length description of the hall's centreline. `s = 0` is the entrance reference. */
export interface MuseumPath {
  curvature: number;
  start: number;
  end: number;
  /** Straight for s < 0, curved after: a wing then meets the hall it opens from at a clean corner. */
  straightStart?: boolean;
}

/** A local frame on the curve. `right` is the visitor's right when looking along `tangent`. */
export interface PathFrame {
  x: number;
  z: number;
  tangentX: number;
  tangentZ: number;
  rightX: number;
  rightZ: number;
  yaw: number;
}

/** A walkable position in path coordinates. */
export interface WalkPoint {
  s: number;
  lateral: number;
}

export interface MuseumDescriptionPanel {
  width: number;
  height: number;
  offsetY: number;
}

export interface MuseumArtwork {
  key: string;
  /** Index into the flat, filtered `shown` array — later used by PhotoView. */
  index: number;
  photo: GalleryPhoto;
  /** Arc-length slot on the centreline. */
  s: number;
  /** -1 for the left wall, +1 for the right wall. */
  side: -1 | 1;
  /** Signed lateral offset from the centreline. */
  lateral: number;
  position: Vec3;
  /** Y rotation: the artwork's local +z always points into the hall. */
  rotationY: number;
  width: number;
  height: number;
  /** The existing localized photo description; never rewritten or added to. */
  caption: string;
  lang: Locale;
  description: MuseumDescriptionPanel;
}

export interface MuseumMarker {
  key: string;
  s: number;
  side: -1 | 1;
  lateral: number;
  position: Vec3;
  rotationY: number;
  number: string;
  name: string;
  lang: Locale;
  text: string;
}

export interface MuseumLayout {
  /** Wall-centre width in metres: full size on desktop, scaled for compact/touch screens. */
  corridorWidth: number;
  /** Distance from the centreline to either wall's inner face. */
  innerHalfWidth: number;
  path: MuseumPath;
  /** Shared sample positions for the floor, ceiling and both walls. */
  sampleS: number[];
  artworks: MuseumArtwork[];
  markers: MuseumMarker[];
  lights: Vec3[];
  urls: string[];
  /** Walkable area starts here instead of at the shell start (a wing's floor reaches back into the junction). */
  walkStart?: number;
}

export interface MuseumLayoutOptions {
  /** Added to every artwork index, so a wing's frames keep their place in the flat photo list. */
  indexOffset?: number;
  start?: number;
  end?: number;
  startInset?: number;
  /** Signed curvature; omitted = the gentle automatic curve. */
  curvature?: number;
  curveSign?: 1 | -1;
  straightStart?: boolean;
  walkStart?: number;
  maxLights?: number;
}

export interface MuseumRoomInput {
  slug: string;
  name: string;
  number: string;
  visible: boolean;
}

interface PhotoEntry {
  photo: GalleryPhoto;
  index: number;
}

interface PhotoSlot extends PhotoEntry {
  s: number;
  side: -1 | 1;
  marker?: {
    room: MuseumRoomInput;
    number: string;
    name: string;
    side: -1 | 1;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHeading(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/** Evaluate the hall centreline and its local frame at arc length `s`. */
export function pathFrame(layout: MuseumLayout, s: number): PathFrame {
  const curvature = layout.path.curvature;
  if (Math.abs(curvature) < 1e-7 || (layout.path.straightStart && s < 0)) {
    return {
      x: 0,
      z: -s,
      tangentX: 0,
      tangentZ: -1,
      rightX: 1,
      rightZ: 0,
      yaw: 0,
    };
  }
  const theta = curvature * s;
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);
  return {
    x: (cos - 1) / curvature,
    z: -sin / curvature,
    tangentX: -sin,
    tangentZ: -cos,
    rightX: cos,
    rightZ: -sin,
    yaw: theta,
  };
}

/** World point at arc length `s`, `lateral` metres to the visitor's right, and height `y`. */
export function pathPoint(layout: MuseumLayout, s: number, lateral = 0, y = 0): Vec3 {
  const frame = pathFrame(layout, s);
  return [frame.x + frame.rightX * lateral, y, frame.z + frame.rightZ * lateral];
}

/** Absolute world yaw for a camera facing along the path at `s`. */
export function pathYaw(layout: MuseumLayout, s: number): number {
  return layout.path.curvature * (layout.path.straightStart ? Math.max(0, s) : s);
}

/** Inverse of pathPoint on the floor plane: path coordinates of a local point (x, z). */
export function pathCoordinates(layout: MuseumLayout, x: number, z: number): WalkPoint {
  const k = layout.path.curvature;
  // The straight part (the whole path when k = 0, or s < 0 with straightStart) runs along -z.
  if (Math.abs(k) < 1e-7 || (layout.path.straightStart && -z < 0)) return { s: -z, lateral: x };
  // Otherwise the centreline is a circle around (-1/k, 0); the signed radius gives the lateral offset.
  const dx = x + 1 / k;
  const r = Math.sign(1 / k) * Math.hypot(dx, z);
  const theta = Math.atan2(-z / r, dx / r);
  return { s: theta / k, lateral: r - 1 / k };
}

function artSize(photo: GalleryPhoto): { width: number; height: number } {
  const aspect = photo.thumb.width / Math.max(1, photo.thumb.height);
  let width = MUSEUM.artHeight * aspect;
  let height = MUSEUM.artHeight;
  if (width > MUSEUM.maxArtWidth) {
    width = MUSEUM.maxArtWidth;
    height = width / aspect;
  } else if (width < MUSEUM.minArtWidth) {
    width = MUSEUM.minArtWidth;
    height = width / aspect;
  }
  return { width, height };
}

function artwork(
  entry: PhotoSlot,
  layout: MuseumLayout,
  lang: Locale,
): MuseumArtwork {
  const { width, height } = artSize(entry.photo);
  const border = MUSEUM.matBorder + MUSEUM.frameBorder;
  const frameHeight = height + 2 * border;
  const frameWidth = width + 2 * border;
  const description: MuseumDescriptionPanel = {
    width: Math.min(MUSEUM.descriptionMaxWidth, Math.max(MUSEUM.descriptionMinWidth, frameWidth)),
    height: MUSEUM.descriptionHeight,
    offsetY: -(frameHeight / 2 + MUSEUM.descriptionGap + MUSEUM.descriptionHeight / 2),
  };
  const lateral = entry.side * (layout.innerHalfWidth + MUSEUM.frameDepth / 2 - MOUNT_CLEARANCE);
  return {
    key: `art-${entry.index}`,
    index: entry.index,
    photo: entry.photo,
    s: entry.s,
    side: entry.side,
    lateral,
    position: pathPoint(layout, entry.s, lateral, MUSEUM.artCentreY),
    rotationY: pathYaw(layout, entry.s) - entry.side * Math.PI / 2,
    width,
    height,
    caption: entry.photo.alt,
    lang,
    description,
  };
}

function twoDigits(n: number, lang: Locale): string {
  const text = formatNumber(n, lang);
  return text.length < 2 ? `${lang === "ne" ? "०" : "0"}${text}` : text;
}

/**
 * Builds one continuous, open-entry hall. Photographs stay in the existing flat order; alternating
 * the wall is only a display detail, and a site change inserts an extra gap so each site's
 * photographs remain a recognisable group. Nothing is reordered or duplicated.
 */
export function buildMuseumLayout(
  rooms: MuseumRoomInput[],
  photos: GalleryPhoto[],
  lang: Locale,
  compact = false,
  options: MuseumLayoutOptions = {},
): MuseumLayout {
  const { artSpacing, siteGap, endInset, minLength } = MUSEUM;
  const startInset = options.startInset ?? MUSEUM.startInset;
  const indexOffset = options.indexOffset ?? 0;
  const width = compact ? COMPACT_CORRIDOR_WIDTH : MUSEUM.corridorWidth;
  const innerHalfWidth = width / 2 - MUSEUM.wallThickness / 2;
  const roomBySlug = new Map(rooms.map((room) => [room.slug, room]));

  // Slots are arc lengths and do not depend on curvature, so the hall can be sized before the path
  // is created. The curvature is then capped by both a radius and a total-turn limit.
  const slots: PhotoSlot[] = [];
  let cursorS = startInset;
  let previousSite: string | null = null;
  photos.forEach((photo, index) => {
    if (previousSite !== null && photo.site !== previousSite) cursorS += siteGap;
    const side: -1 | 1 = index % 2 === 0 ? -1 : 1;
    const slot: PhotoSlot = { photo, index: index + indexOffset, s: cursorS, side };
    if (previousSite !== photo.site) {
      const room = roomBySlug.get(photo.site);
      const number = room?.number ?? twoDigits([...roomBySlug.keys()].indexOf(photo.site) + 1, lang);
      slot.marker = {
        room: room ?? { slug: photo.site, name: photo.site, number, visible: true },
        number,
        name: room?.name ?? photo.site,
        side: side === -1 ? 1 : -1,
      };
    }
    slots.push(slot);
    previousSite = photo.site;
    cursorS += artSpacing;
  });

  const start = options.start ?? -MUSEUM.entryOverhang;
  const lastS = slots.length > 0 ? slots[slots.length - 1].s : startInset;
  const end = options.end ?? Math.max(lastS + endInset, start + minLength);
  const hallLength = end - start;
  const curvature =
    options.curvature ?? (options.curveSign ?? 1) * Math.min(MUSEUM.maxCurvature, MUSEUM.maxTurn / hallLength);

  const sampleSet = new Set<number>([start, 0, end]);
  for (let s = start + MUSEUM.shellSampleStep; s < end; s += MUSEUM.shellSampleStep) {
    sampleSet.add(s);
  }
  slots.forEach((slot) => sampleSet.add(slot.s));
  const sampleS = [...sampleSet].sort((a, b) => a - b);

  const layout: MuseumLayout = {
    corridorWidth: width,
    innerHalfWidth,
    path: { curvature, start, end, straightStart: options.straightStart },
    sampleS,
    artworks: [],
    markers: [],
    lights: [],
    urls: [],
    walkStart: options.walkStart,
  };

  layout.artworks = slots.map((slot) => artwork(slot, layout, lang));
  layout.markers = slots.flatMap((slot) => {
    if (!slot.marker) return [];
    const { marker } = slot;
    const lateral = marker.side * (innerHalfWidth + MUSEUM.plaqueDepth / 2 - MOUNT_CLEARANCE);
    return [
      {
        key: `site-${slot.photo.site}-${slot.index}`,
        s: slot.s,
        side: marker.side,
        lateral,
        position: pathPoint(layout, slot.s, lateral, MUSEUM.markerCentreY),
        rotationY: pathYaw(layout, slot.s) - marker.side * Math.PI / 2,
        number: marker.number,
        name: marker.name,
        lang,
        text: `${marker.number}  ${marker.name}`,
      },
    ];
  });

  const lightCount = Math.min(options.maxLights ?? 9, Math.max(3, Math.ceil(hallLength / 10)));
  layout.lights = Array.from({ length: lightCount }, (_, index) => {
    const s = start + ((index + 0.5) * hallLength) / lightCount;
    const lateral = index % 2 === 0 ? 0.8 : -0.8;
    return pathPoint(layout, s, lateral, MUSEUM.corridorHeight - 0.5);
  });
  layout.urls = layout.artworks.map((item) => item.photo.thumb.src);
  return layout;
}

/* ---- Navigation: pure geometry, no renderer imports ---- */

export interface CameraPose {
  /** Arc length along the hall's centreline. */
  s: number;
  /** Signed offset from the centreline; + is the visitor's right. */
  lateral: number;
  /** Yaw relative to the path tangent; 0 follows the curve. */
  heading: number;
  pitch: number;
}

/** Match the static scene's opening view; the camera never starts outside the open entrance. */
export const INITIAL_POSE: CameraPose = { s: 0, lateral: 0, heading: 0, pitch: 0 };
/** Start nearer the open threshold on compact screens so the first frames fit the taller view. */
export const COMPACT_INITIAL_POSE: CameraPose = { s: -2.35, lateral: 0, heading: 0, pitch: 0 };

interface WalkBounds {
  sMin: number;
  sMax: number;
  lateralMin: number;
  lateralMax: number;
}

function walkBounds(layout: MuseumLayout, radius = MUSEUM.walkRadius): WalkBounds {
  const margin = radius + MUSEUM.frameClearance;
  return {
    sMin: (layout.walkStart ?? layout.path.start) + margin,
    sMax: layout.path.end - margin,
    lateralMin: -layout.innerHalfWidth + margin,
    lateralMax: layout.innerHalfWidth - margin,
  };
}

function contains(bounds: WalkBounds, point: WalkPoint): boolean {
  return (
    point.s >= bounds.sMin &&
    point.s <= bounds.sMax &&
    point.lateral >= bounds.lateralMin &&
    point.lateral <= bounds.lateralMax
  );
}

export function isMuseumWalkable(
  layout: MuseumLayout,
  point: WalkPoint,
  radius = MUSEUM.walkRadius,
): boolean {
  return contains(walkBounds(layout, radius), point);
}

/** Clamp a preserved pose into the current hall, keeping its viewing direction. */
export function clampPose(layout: MuseumLayout, pose: CameraPose, radius = MUSEUM.walkRadius): CameraPose {
  const bounds = walkBounds(layout, radius);
  return {
    ...pose,
    s: clamp(pose.s, bounds.sMin, bounds.sMax),
    lateral: clamp(pose.lateral, bounds.lateralMin, bounds.lateralMax),
  };
}

/**
 * Move from `from` towards `to` in short steps, sliding along walls instead of crossing them.
 * Stepping (rather than a single end-point test) prevents a large key/wheel delta from tunnelling
 * through a wall or through a framed photograph.
 */
export function clipMuseumPosition(
  layout: MuseumLayout,
  from: WalkPoint,
  to: WalkPoint,
  radius = MUSEUM.walkRadius,
): WalkPoint {
  const bounds = walkBounds(layout, radius);
  const walkable = (s: number, lateral: number) => contains(bounds, { s, lateral });
  let s = from.s;
  let lateral = from.lateral;
  const ds = to.s - s;
  const dl = to.lateral - lateral;
  const steps = Math.max(1, Math.ceil(Math.hypot(ds, dl) / 0.08));
  for (let i = 1; i <= steps; i += 1) {
    const ns = from.s + (ds * i) / steps;
    const nl = from.lateral + (dl * i) / steps;
    if (walkable(ns, nl)) {
      s = ns;
      lateral = nl;
      continue;
    }
    if (walkable(ns, lateral)) s = ns;
    if (walkable(s, nl)) lateral = nl;
  }
  return { s, lateral };
}

/** Advance in the camera's local frame. Positive `strafe` is the visitor's right. */
export function moveAlongPath(
  layout: MuseumLayout,
  pose: CameraPose,
  forward: number,
  strafe: number,
  distance: number,
): CameraPose {
  const cos = Math.cos(pose.heading);
  const sin = Math.sin(pose.heading);
  const ds = (forward * cos + strafe * sin) * distance;
  const dl = (-forward * sin + strafe * cos) * distance;
  const next = clipMuseumPosition(
    layout,
    { s: pose.s, lateral: pose.lateral },
    { s: pose.s + ds, lateral: pose.lateral + dl },
  );
  return { ...pose, ...next };
}

/** Flat artwork order by photo index — exactly the order of the accessible DOM frames. */
export function orderedArtworks(layout: MuseumLayout): MuseumArtwork[] {
  return [...layout.artworks].sort((a, b) => a.index - b.index);
}

/** Stand in front of a frame and look straight at it, following the local frame rotation. */
export function artworkPose(layout: MuseumLayout, art: MuseumArtwork, distance = 2.0): CameraPose {
  const mount = layout.innerHalfWidth + MUSEUM.frameDepth / 2 - MOUNT_CLEARANCE;
  return {
    s: art.s,
    lateral: art.side * (mount - distance),
    heading: -art.side * Math.PI / 2,
    pitch: 0,
  };
}
