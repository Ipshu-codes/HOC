import { formatNumber } from "@/lib/format";
import type { GalleryPhoto } from "@/lib/images";
import type { Locale } from "@/types/locale";

/**
 * Pure layout for the gallery's 3D museum. No Three.js imports here: this module only
 * describes one open-entry exhibition corridor in metres, so it can be reasoned about
 * without a renderer. Words are never invented here: the marker text is the site number
 * and name already rendered by the gallery DOM.
 */

export type Vec3 = [number, number, number];

/** A frame's on-screen box, used only to place the shared photo view's FLIP source. */
export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const MUSEUM = {
  corridorWidth: 10.4,
  corridorHeight: 4.6,
  wallThickness: 0.24,
  /** The entrance is an open threshold; floor/ceiling/walls continue this far behind the camera. */
  entryOverhang: 3.2,
  eyeHeight: 1.65,
  /** Larger prints are hung a little higher so the label below still clears the floor. */
  artCentreY: 2.32,
  /** Site plaques stay at their original absolute height whichever artwork size is built. */
  markerCentreY: 3.09,
  /** Bigger prints get longer slots: the corridor extends instead of crowding neighbouring works. */
  artSpacing: 3.6,
  siteGap: 2.4,
  startInset: 4.4,
  endInset: 4.2,
  minLength: 32,
  /** Photograph height; width is 2.05 × the photo's own aspect ratio (≈1.38–2.93 m here). */
  artHeight: 2.05,
  minArtWidth: 1.35,
  maxArtWidth: 3.5,
  matBorder: 0.16,
  frameBorder: 0.09,
  frameDepth: 0.1,
  plaqueWidth: 1.9,
  plaqueHeight: 0.78,
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

export type SurfaceKind = "wall" | "floor" | "ceiling" | "panel";

export interface MuseumSurface {
  key: string;
  kind: SurfaceKind;
  position: Vec3;
  size: Vec3;
}

/** Wall-mounted caption panel. `offsetY` is local to the frame centre; its top edge always stays
 *  below the frame, so resizing a photograph moves the label with it. */
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
  position: Vec3;
  /** Y rotation: the artwork's local +z always points into the room. */
  rotationY: number;
  width: number;
  height: number;
  /** The existing localized photo description; never rewritten or added to. */
  caption: string;
  lang: Locale;
  description: MuseumDescriptionPanel;
}

/** An existing site number/name plaque at the start of that site's run of photographs. */
export interface MuseumMarker {
  key: string;
  position: Vec3;
  rotationY: number;
  number: string;
  name: string;
  lang: Locale;
  text: string;
}

export interface MuseumLayout {
  /** Open entrance plane (positive Z). There is deliberately no wall mesh here. */
  zNear: number;
  /** Solid, finished far wall (negative Z). */
  zFar: number;
  surfaces: MuseumSurface[];
  artworks: MuseumArtwork[];
  markers: MuseumMarker[];
  lights: Vec3[];
  urls: string[];
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

interface WalkRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
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

function artwork(entry: PhotoEntry, position: Vec3, rotationY: number, lang: Locale): MuseumArtwork {
  const { width, height } = artSize(entry.photo);
  const border = MUSEUM.matBorder + MUSEUM.frameBorder;
  const frameHeight = height + 2 * border;
  const frameWidth = width + 2 * border;
  const description: MuseumDescriptionPanel = {
    width: Math.min(MUSEUM.descriptionMaxWidth, Math.max(MUSEUM.descriptionMinWidth, frameWidth)),
    height: MUSEUM.descriptionHeight,
    offsetY: -(frameHeight / 2 + MUSEUM.descriptionGap + MUSEUM.descriptionHeight / 2),
  };
  return {
    key: `art-${entry.index}`,
    index: entry.index,
    photo: entry.photo,
    position,
    rotationY,
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
 * Builds one continuous, open-entry corridor. Photographs stay in the existing flat order;
 * alternating the wall is only a display detail, and a site change inserts an extra gap so
 * each site's photographs remain a recognisable group. Nothing is reordered or duplicated.
 */
export function buildMuseumLayout(rooms: MuseumRoomInput[], photos: GalleryPhoto[], lang: Locale): MuseumLayout {
  const { corridorWidth: width, corridorHeight: height, artCentreY, artSpacing, siteGap, startInset, endInset, minLength } = MUSEUM;
  const half = width / 2;
  const roomBySlug = new Map(rooms.map((room) => [room.slug, room]));
  // Mount on the room-facing side of the wall, not inside its thickness: the wall's inner face is
  // half - wallThickness/2, so a frame/plaque front must clear that face or the wall occludes it.
  const wallFace = half - MUSEUM.wallThickness / 2;
  const mountClearance = 0.012;
  const artworkWallX = wallFace + MUSEUM.frameDepth / 2 - mountClearance;
  const plaqueWallX = wallFace + 0.03 - mountClearance;

  const artworks: MuseumArtwork[] = [];
  const markers: MuseumMarker[] = [];
  let cursorZ = -startInset;
  let previousSite: string | null = null;

  photos.forEach((photo, index) => {
    if (previousSite !== null && photo.site !== previousSite) cursorZ -= siteGap;

    // The side is decided from the unchanged flat index: every photo gets exactly one slot.
    const side: -1 | 1 = index % 2 === 0 ? -1 : 1;
    artworks.push(
      artwork(
        { photo, index },
        [side * artworkWallX, artCentreY, cursorZ],
        side === -1 ? Math.PI / 2 : -Math.PI / 2,
        lang,
      ),
    );

    if (previousSite !== photo.site) {
      const room = roomBySlug.get(photo.site);
      const number = room?.number ?? twoDigits([...roomBySlug.keys()].indexOf(photo.site) + 1, lang);
      const name = room?.name ?? photo.site;
      const markerSide: -1 | 1 = side === -1 ? 1 : -1;
      markers.push({
        key: `site-${photo.site}-${index}`,
        position: [markerSide * plaqueWallX, MUSEUM.markerCentreY, cursorZ],
        rotationY: markerSide === -1 ? Math.PI / 2 : -Math.PI / 2,
        number,
        name,
        lang,
        text: `${number}  ${name}`,
      });
    }

    previousSite = photo.site;
    cursorZ -= artSpacing;
  });

  const lastZ = artworks.length ? cursorZ + artSpacing : -startInset;
  const zNear = MUSEUM.entryOverhang;
  const zFar = Math.min(lastZ - endInset, zNear - minLength);
  const length = zNear - zFar;
  const centreZ = (zNear + zFar) / 2;
  const t = MUSEUM.wallThickness;

  const surfaces: MuseumSurface[] = [
    { key: "corridor-floor", kind: "floor", position: [0, 0, centreZ], size: [width, 0.16, length] },
    { key: "corridor-ceiling", kind: "ceiling", position: [0, height, centreZ], size: [width, 0.16, length] },
    { key: "corridor-left", kind: "wall", position: [-half, height / 2, centreZ], size: [t, height, length] },
    { key: "corridor-right", kind: "wall", position: [half, height / 2, centreZ], size: [t, height, length] },
    { key: "corridor-far", kind: "wall", position: [0, height / 2, zFar], size: [width, height, t] },
    {
      key: "corridor-far-panel",
      kind: "panel",
      position: [0, height / 2, zFar + t / 2 + 0.04],
      size: [width * 0.42, height * 0.58, 0.06],
    },
  ];

  const lightCount = Math.min(9, Math.max(3, Math.ceil(length / 10)));
  const lights: Vec3[] = Array.from({ length: lightCount }, (_, index) => [
    0,
    height - 0.5,
    zNear - ((index + 0.5) * length) / lightCount,
  ]);

  return {
    zNear,
    zFar,
    surfaces,
    artworks,
    markers,
    lights,
    urls: artworks.map((art) => art.photo.thumb.src),
  };
}

/* ---- Navigation: pure geometry, no renderer imports ---- */

export interface CameraPose {
  x: number;
  z: number;
  yaw: number;
  pitch: number;
}

/** Match the static scene's opening view; the camera never starts outside the open entrance. */
export const INITIAL_POSE: CameraPose = { x: 0, z: 0, yaw: 0, pitch: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function contains(rect: WalkRect, x: number, z: number): boolean {
  return x >= rect.minX && x <= rect.maxX && z >= rect.minZ && z <= rect.maxZ;
}

/**
 * One inset rectangle: the corridor interior. The entrance is visually open, but its
 * boundary is still a collision limit so the camera cannot walk out into the void.
 * The body radius and the small frame clearance are already subtracted.
 */
export function corridorWalkRect(layout: MuseumLayout, radius = MUSEUM.walkRadius): WalkRect {
  const half = MUSEUM.corridorWidth / 2;
  const margin = radius + MUSEUM.frameClearance;
  return {
    minX: -half + margin,
    maxX: half - margin,
    minZ: layout.zFar + margin,
    maxZ: layout.zNear - margin,
  };
}

export function isMuseumWalkable(layout: MuseumLayout, x: number, z: number, radius = MUSEUM.walkRadius): boolean {
  return contains(corridorWalkRect(layout, radius), x, z);
}

/** Clamp a preserved pose into the current corridor, keeping its viewing direction. */
export function clampPose(layout: MuseumLayout, pose: CameraPose, radius = MUSEUM.walkRadius): CameraPose {
  const rect = corridorWalkRect(layout, radius);
  return { ...pose, x: clamp(pose.x, rect.minX, rect.maxX), z: clamp(pose.z, rect.minZ, rect.maxZ) };
}

/**
 * Move from `from` towards `to` in short steps, sliding along walls instead of crossing them.
 * Stepping (rather than a single end-point test) prevents a large key/wheel delta from tunnelling
 * through a wall or through a framed photograph.
 */
export function clipCorridorPosition(
  layout: MuseumLayout,
  from: [number, number],
  to: [number, number],
  radius = MUSEUM.walkRadius,
): [number, number] {
  const rect = corridorWalkRect(layout, radius);
  const walkable = (x: number, z: number) => contains(rect, x, z);
  let x = from[0];
  let z = from[1];
  const dx = to[0] - x;
  const dz = to[1] - z;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
  for (let i = 1; i <= steps; i += 1) {
    const nx = from[0] + (dx * i) / steps;
    const nz = from[1] + (dz * i) / steps;
    if (walkable(nx, nz)) {
      x = nx;
      z = nz;
      continue;
    }
    if (walkable(nx, z)) x = nx;
    if (walkable(x, nz)) z = nz;
  }
  return [x, z];
}

/** Flat artwork order by photo index — exactly the order of the accessible DOM frames. */
export function orderedArtworks(layout: MuseumLayout): MuseumArtwork[] {
  return [...layout.artworks].sort((a, b) => a.index - b.index);
}

/** Stand in front of a frame and look straight at it: local +z of the frame points into the room. */
export function artworkPose(art: MuseumArtwork, distance = 2.0): CameraPose {
  return {
    x: art.position[0] + Math.sin(art.rotationY) * distance,
    z: art.position[2] + Math.cos(art.rotationY) * distance,
    yaw: art.rotationY,
    pitch: 0,
  };
}
