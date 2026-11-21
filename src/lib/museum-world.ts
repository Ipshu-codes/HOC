import type { GalleryPhoto } from "@/lib/images";
import {
  COMPACT_CORRIDOR_WIDTH,
  MUSEUM,
  buildMuseumLayout,
  descriptionPanel,
  isMuseumWalkable,
  normalizeHeading,
  pathCoordinates,
  pathPoint,
  pathYaw,
  type CameraPose,
  type MuseumArtwork,
  type MuseumDescriptionPanel,
  type MuseumLayout,
  type MuseumRoomInput,
  type Vec3,
} from "@/lib/museum-layout";
import type { Locale } from "@/types/locale";

/**
 * The museum as one or more halls ("segments") placed in the world. Still pure geometry, no Three.js.
 *
 * - The gallery page is a single hall at the origin (exactly the original museum).
 * - The home page is a T: an entrance hall with the ward map (left wall) and logo (right wall), ending
 *   in a junction whose far wall carries one signboard per site; each sign leads into that site's wing.
 *
 * Every hall is an ordinary MuseumLayout. A segment only adds where its path starts (x, z) and which
 * way it faces (yaw), so all existing hall code (shell, frames, walk bounds) works unchanged inside a
 * <group> with that transform. Yaw follows Three.js: +yaw turns left, and yaw 0 looks down -z.
 */

export interface MuseumSegment {
  key: string;
  layout: MuseumLayout;
  x: number;
  z: number;
  yaw: number;
  /** The site whose photographs hang here; null for the entrance hall and the single gallery hall. */
  site: string | null;
  /** Wall extents in path `s`; a missing side means the wall runs the whole hall. */
  wallSpans?: { left: [number, number]; right: [number, number] };
  /** The small cream panel on the far end wall (the entrance has signboards there instead). */
  endPanel: boolean;
  /** Red carpet from s0 to s1 along the centreline. */
  carpet: [number, number];
}

export interface MuseumDisplay {
  key: "map" | "logo";
  seg: number;
  s: number;
  side: -1 | 1;
  /** Local position/rotation inside the segment group; +z of the display faces into the hall. */
  position: Vec3;
  rotationY: number;
  /** The picture itself, without mat and frame. */
  width: number;
  height: number;
  src: string;
  /** Sharper file, requested only while the visitor looks at it closely. */
  hiSrc: string;
  /** Existing alt text from content/ward.json; also the wall label and the close-up caption. */
  alt: string;
  description: MuseumDescriptionPanel;
}

export interface MuseumSign {
  key: string;
  label: string;
  /** -1: the arrow points left; +1: right. */
  dir: -1 | 1;
  seg: number;
  position: Vec3;
  rotationY: number;
  width: number;
  height: number;
  /** The wing it leads into. */
  target: number;
}

export interface PlacedArtwork {
  art: MuseumArtwork;
  seg: number;
  /** World centre of the print, for distance checks. */
  world: Vec3;
}

export interface MuseumWorld {
  segments: MuseumSegment[];
  displays: MuseumDisplay[];
  signs: MuseumSign[];
  /** Flat, ordered by photo index (the order of the accessible DOM frames and of PhotoView). */
  artworks: PlacedArtwork[];
  /** World floor point between the halls; flights between halls pass over it. */
  junction: { x: number; z: number } | null;
  /** Entrance `s` from which the junction (and both wings) come into view. */
  junctionFrom: number | null;
}

/** Camera pose in one segment's path coordinates. */
export interface WorldPose extends CameraPose {
  seg: number;
}

/** A free camera placement in world space (used while flying and while looking closely). */
export interface ViewPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
}

export interface ExhibitInput {
  map: { src: string; hiSrc: string; width: number; height: number; alt: string } | null;
  logo: { src: string; width: number; height: number; alt: string } | null;
  /** One wing per visible site, with the words for its signboard and the side it opens to. */
  wings: { slug: string; label: string; side: -1 | 1 }[];
}

const MOUNT_CLEARANCE = 0.012;

/* ---- Coordinate helpers ---- */

export function toWorld(seg: MuseumSegment, local: Vec3): Vec3 {
  const c = Math.cos(seg.yaw);
  const s = Math.sin(seg.yaw);
  return [seg.x + local[0] * c + local[2] * s, local[1], seg.z - local[0] * s + local[2] * c];
}

function toLocal(seg: MuseumSegment, x: number, z: number): { x: number; z: number } {
  const dx = x - seg.x;
  const dz = z - seg.z;
  const c = Math.cos(seg.yaw);
  const s = Math.sin(seg.yaw);
  return { x: dx * c - dz * s, z: dx * s + dz * c };
}

export function segmentPoint(seg: MuseumSegment, s: number, lateral: number, y: number): Vec3 {
  return toWorld(seg, pathPoint(seg.layout, s, lateral, y));
}

export function poseYaw(world: MuseumWorld, pose: WorldPose): number {
  const seg = world.segments[pose.seg];
  return seg.yaw + pathYaw(seg.layout, pose.s) + pose.heading;
}

export function viewOf(world: MuseumWorld, pose: WorldPose, y: number = MUSEUM.eyeHeight): ViewPose {
  const [x, , z] = segmentPoint(world.segments[pose.seg], pose.s, pose.lateral, 0);
  return { x, y, z, yaw: poseYaw(world, pose), pitch: pose.pitch };
}

/** The same place and viewing direction, expressed in another segment's path coordinates. */
export function convertPose(world: MuseumWorld, pose: WorldPose, seg: number): WorldPose {
  if (pose.seg === seg) return pose;
  const view = viewOf(world, pose);
  return poseAt(world, seg, view.x, view.z, view.yaw, pose.pitch);
}

export function poseAt(world: MuseumWorld, seg: number, x: number, z: number, yaw: number, pitch: number): WorldPose {
  const segment = world.segments[seg];
  const local = toLocal(segment, x, z);
  const { s, lateral } = pathCoordinates(segment.layout, local.x, local.z);
  return { seg, s, lateral, heading: normalizeHeading(yaw - segment.yaw - pathYaw(segment.layout, s)), pitch };
}

/** The walkable segment that contains a world point, preferring `prefer`; -1 when none does. */
export function segmentAt(world: MuseumWorld, x: number, z: number, prefer: number): number {
  const order = [prefer, ...world.segments.map((_, index) => index).filter((index) => index !== prefer)];
  for (const index of order) {
    const segment = world.segments[index];
    const local = toLocal(segment, x, z);
    if (isMuseumWalkable(segment.layout, pathCoordinates(segment.layout, local.x, local.z))) return index;
  }
  return -1;
}

/**
 * Advance in the camera's local frame, in short steps so nothing tunnels through a wall. Inside a hall
 * this is the original sliding movement; a step that leaves the hall into a neighbouring one (through
 * the junction) carries on there with the same world position and viewing direction.
 */
export function moveInWorld(world: MuseumWorld, pose: WorldPose, forward: number, strafe: number, distance: number): WorldPose {
  let current = { ...pose };
  const length = Math.abs(distance) * Math.hypot(forward, strafe);
  const steps = Math.max(1, Math.ceil(length / 0.08));
  for (let step = 0; step < steps; step += 1) {
    const layout = world.segments[current.seg].layout;
    const cos = Math.cos(current.heading);
    const sin = Math.sin(current.heading);
    const ds = ((forward * cos + strafe * sin) * distance) / steps;
    const dl = ((-forward * sin + strafe * cos) * distance) / steps;
    const s = current.s + ds;
    const lateral = current.lateral + dl;
    if (isMuseumWalkable(layout, { s, lateral })) {
      current = { ...current, s, lateral };
      continue;
    }
    const [x, , z] = segmentPoint(world.segments[current.seg], s, lateral, 0);
    const other = world.segments.length > 1 ? segmentAt(world, x, z, current.seg) : -1;
    if (other >= 0 && other !== current.seg) {
      current = poseAt(world, other, x, z, poseYaw(world, current), current.pitch);
      continue;
    }
    if (isMuseumWalkable(layout, { s, lateral: current.lateral })) current = { ...current, s };
    if (isMuseumWalkable(layout, { s: current.s, lateral })) current = { ...current, lateral };
  }
  return current;
}

/** Keep a preserved pose inside the current world (a layout change can shorten a hall). */
export function clampWorldPose(world: MuseumWorld, pose: WorldPose): WorldPose {
  const seg = pose.seg < world.segments.length ? pose.seg : 0;
  const layout = world.segments[seg].layout;
  const margin = MUSEUM.walkRadius + MUSEUM.frameClearance;
  const sMin = (layout.walkStart ?? layout.path.start) + margin;
  const sMax = layout.path.end - margin;
  const lMax = layout.innerHalfWidth - margin;
  return {
    ...pose,
    seg,
    s: Math.min(sMax, Math.max(sMin, pose.s)),
    lateral: Math.min(lMax, Math.max(-lMax, pose.lateral)),
  };
}

/** Where the home page museum opens: just inside the entrance, looking down the hall. */
export const EXHIBIT_START_POSE: WorldPose = { seg: 0, s: -2.4, lateral: 0, heading: 0, pitch: 0 };

/* ---- Building the halls ---- */

function wallMount(layout: MuseumLayout, depth: number): number {
  return layout.innerHalfWidth + depth / 2 - MOUNT_CLEARANCE;
}

function placeArtworks(segments: MuseumSegment[]): PlacedArtwork[] {
  return segments
    .flatMap((segment, seg) =>
      segment.layout.artworks.map((art) => ({ art, seg, world: toWorld(segment, art.position) })),
    )
    .sort((a, b) => a.art.index - b.art.index);
}

/** The gallery page: the original single hall, now with the red carpet down its middle. */
export function buildHallWorld(rooms: MuseumRoomInput[], photos: GalleryPhoto[], lang: Locale, compact: boolean): MuseumWorld {
  const layout = buildMuseumLayout(rooms, photos, lang, compact);
  const segments: MuseumSegment[] = [
    {
      key: "hall",
      layout,
      x: 0,
      z: 0,
      yaw: 0,
      site: null,
      endPanel: true,
      carpet: [layout.path.start + 0.4, layout.path.end - 1.2],
    },
  ];
  return { segments, displays: [], signs: [], artworks: placeArtworks(segments), junction: null, junctionFrom: null };
}

/**
 * The home page museum. Sizes are in metres; the compact (phone/tablet) hall is narrower, so the
 * displays and signs are a little smaller there too. Photos keep their flat order and indices: each
 * wing takes its site's contiguous run of the photo list.
 */
export function buildExhibitWorld(
  rooms: MuseumRoomInput[],
  photos: GalleryPhoto[],
  lang: Locale,
  compact: boolean,
  exhibit: ExhibitInput,
): MuseumWorld {
  const width = compact ? COMPACT_CORRIDOR_WIDTH : MUSEUM.corridorWidth;
  const half = width / 2 - MUSEUM.wallThickness / 2;
  const displayS = compact ? 4.4 : 5.4;

  // Map: as tall as the hall allows, to its own aspect ratio; logo: a square emblem beside it.
  let mapHeight = compact ? 2.45 : 2.9;
  let mapWidth = exhibit.map ? (mapHeight * exhibit.map.width) / exhibit.map.height : 0;
  const maxMapWidth = compact ? 3.5 : 4.2;
  if (mapWidth > maxMapWidth) {
    mapHeight *= maxMapWidth / mapWidth;
    mapWidth = maxMapWidth;
  }
  const logoSize = compact ? 1.9 : 2.3;
  const border = MUSEUM.matBorder + MUSEUM.frameBorder;
  const widest = Math.max(mapWidth, exhibit.logo ? logoSize : 0) + 2 * border;
  // The side walls stop where the junction begins; the junction is one hall-width deep.
  const junctionStart = displayS + widest / 2 + (compact ? 1.3 : 1.7);
  const end = junctionStart + 2 * half;
  const junctionS = end - half;

  const wings = exhibit.wings.filter((wing) => photos.some((photo) => photo.site === wing.slug));
  const hasLeft = wings.some((wing) => wing.side === -1);
  const hasRight = wings.some((wing) => wing.side === 1);
  const start = -MUSEUM.entryOverhang;
  const carpetHalf = (compact ? 1.9 : 2.4) / 2;

  const entrance = buildMuseumLayout(rooms, [], lang, compact, { start, end, curvature: 0, maxLights: 3 });
  const segments: MuseumSegment[] = [
    {
      key: "entrance",
      layout: entrance,
      x: 0,
      z: 0,
      yaw: 0,
      site: null,
      wallSpans: { left: [start, hasLeft ? junctionStart : end], right: [start, hasRight ? junctionStart : end] },
      endPanel: false,
      carpet: [start + 0.4, wings.length > 0 ? junctionS + carpetHalf : end - 1.2],
    },
  ];

  const signs: MuseumSign[] = [];
  const signWidth = compact ? 3 : 3.8;
  const signHeight = compact ? 1.25 : 1.6;
  wings.forEach((wing) => {
    const first = photos.findIndex((photo) => photo.site === wing.slug);
    const sitePhotos = photos.filter((photo) => photo.site === wing.slug);
    // Each wing starts at its opening in the entrance wall, facing away from the entrance, and its
    // gentle curve bends away from the junction on both sides. Its floor reaches back across the
    // junction (walkStart) so visitors can walk in from anywhere in it.
    const layout = buildMuseumLayout(rooms, sitePhotos, lang, compact, {
      indexOffset: first,
      start: 0,
      startInset: 3.6,
      curveSign: wing.side,
      straightStart: true,
      walkStart: -2 * half,
      maxLights: 3,
    });
    const target = segments.length;
    segments.push({
      key: `wing-${wing.slug}`,
      layout,
      x: wing.side * half,
      z: -junctionS,
      yaw: (-wing.side * Math.PI) / 2,
      site: wing.slug,
      endPanel: true,
      carpet: [-half + carpetHalf, layout.path.end - 1.2],
    });
    signs.push({
      key: wing.slug,
      label: wing.label,
      dir: wing.side,
      seg: 0,
      position: pathPoint(entrance, end, (wing.side * half) / 2, compact ? 2.7 : 2.95),
      rotationY: pathYaw(entrance, end),
      width: signWidth,
      height: signHeight,
      target,
    });
  });

  const displays: MuseumDisplay[] = [];
  const place = (key: "map" | "logo", side: -1 | 1, w: number, h: number, src: string, hiSrc: string, alt: string) => {
    const lateral = side * wallMount(entrance, MUSEUM.frameDepth);
    // Same hanging as the photographs: frame on the common base line, label right underneath.
    const frameHeight = h + 2 * border;
    displays.push({
      key,
      seg: 0,
      s: displayS,
      side,
      position: pathPoint(entrance, displayS, lateral, MUSEUM.frameBaseY + frameHeight / 2),
      rotationY: pathYaw(entrance, displayS) - (side * Math.PI) / 2,
      width: w,
      height: h,
      src,
      hiSrc,
      alt,
      description: descriptionPanel(alt, w + 2 * border, frameHeight, lang),
    });
  };
  if (exhibit.map) place("map", -1, mapWidth, mapHeight, exhibit.map.src, exhibit.map.hiSrc, exhibit.map.alt);
  if (exhibit.logo) place("logo", 1, logoSize, logoSize, exhibit.logo.src, exhibit.logo.src, exhibit.logo.alt);

  return {
    segments,
    displays,
    signs,
    artworks: placeArtworks(segments),
    junction: wings.length > 0 ? { x: 0, z: -junctionS } : null,
    junctionFrom: wings.length > 0 ? junctionStart - 2 : null,
  };
}

/* ---- Looking closely ---- */

export interface FocusItem {
  seg: number;
  s: number;
  side: -1 | 1;
  centreY: number;
  /** Outer size, frame included. */
  width: number;
  height: number;
  /** Yaw of the item's face inside its segment (its +z points into the hall). */
  rotationY: number;
}

/** The whole exhibit, picture and label together, so a close look always includes the description. */
function exhibitItem(
  seg: number,
  s: number,
  side: -1 | 1,
  position: Vec3,
  rotationY: number,
  width: number,
  height: number,
  label: MuseumDescriptionPanel,
): FocusItem {
  const border = 2 * (MUSEUM.matBorder + MUSEUM.frameBorder);
  const frameHeight = height + border;
  const below = MUSEUM.descriptionGap + label.height;
  return {
    seg,
    s,
    side,
    centreY: position[1] - below / 2,
    width: Math.max(width + border, label.width),
    height: frameHeight + below,
    rotationY,
  };
}

export function artworkFocusItem(placed: PlacedArtwork): FocusItem {
  const { art } = placed;
  return exhibitItem(placed.seg, art.s, art.side, art.position, art.rotationY, art.width, art.height, art.description);
}

export function displayFocusItem(display: MuseumDisplay): FocusItem {
  return exhibitItem(display.seg, display.s, display.side, display.position, display.rotationY, display.width, display.height, display.description);
}

export interface FocusViewport {
  width: number;
  height: number;
  /** Vertical field of view, degrees. */
  fov: number;
  /** Pixels kept free for the details card: on the right (wide screens) or at the bottom (phones). */
  reserveRight: number;
  reserveBottom: number;
}

/**
 * Where to stand to see an item large: straight in front of it, close enough that it fills most of
 * the part of the screen the details card leaves free, and shifted so it sits in the middle of that part.
 */
export function focusPose(world: MuseumWorld, item: FocusItem, viewport: FocusViewport): { pose: WorldPose; y: number } {
  const layout = world.segments[item.seg].layout;
  const { width: W, height: H } = viewport;
  const tanV = Math.tan((viewport.fov * Math.PI) / 360);
  const tanH = tanV * (W / Math.max(1, H));
  const regionW = Math.max(160, W - viewport.reserveRight);
  const regionH = Math.max(160, H - viewport.reserveBottom);
  const fill = 0.84;
  const need = Math.max((item.height * H) / (2 * tanV * regionH * fill), (item.width * W) / (2 * tanH * regionW * fill));
  const margin = MUSEUM.walkRadius + MUSEUM.frameClearance;
  const mount = wallMount(layout, MUSEUM.frameDepth);
  const distance = Math.min(Math.max(need, 1.1), mount + layout.innerHalfWidth - margin);
  const perPixel = (2 * distance * tanV) / Math.max(1, H);
  const shiftRight = -(regionW / 2 - W / 2) * perPixel;
  const y = Math.min(MUSEUM.corridorHeight - 0.4, Math.max(0.5, item.centreY + (regionH / 2 - H / 2) * perPixel));
  // Facing the left wall, the visitor's right is further along the hall; facing the right wall, back.
  const s = item.s - item.side * shiftRight;
  const segment = world.segments[item.seg];
  const heading = normalizeHeading(item.rotationY - pathYaw(segment.layout, s));
  return { pose: { seg: item.seg, s, lateral: item.side * (mount - distance), heading, pitch: 0 }, y };
}

/** A few steps into a wing, looking along it: where choosing a signboard takes the visitor. */
export function wingEntryPose(seg: number): WorldPose {
  return { seg, s: 1.2, lateral: 0, heading: 0, pitch: 0 };
}
