import { formatNumber } from "@/lib/format";
import type { GalleryPhoto } from "@/lib/images";
import type { Locale } from "@/types/locale";

/**
 * Pure layout for the gallery's 3D museum. No Three.js imports here: this module only
 * describes rooms, walls, alcoves and framed artworks in metres, so it can be read and
 * tested without a renderer. The architecture is deliberately generic — plain modern
 * exhibition halls with no site-specific or historical structural claims.
 */

export type Vec3 = [number, number, number];

export const MUSEUM = {
  hallWidth: 7.4,
  hallHeight: 4.4,
  wallThickness: 0.24,
  doorWidth: 2.0,
  doorHeight: 2.9,
  eyeHeight: 1.65,
  artCentreY: 1.76,
  artSpacing: 2.5,
  artHeight: 1.0,
  minArtWidth: 0.74,
  maxArtWidth: 1.5,
  matBorder: 0.14,
  frameBorder: 0.085,
  frameDepth: 0.09,
  alcoveDepth: 3.3,
  alcoveLength: 4.8,
  alcoveDoorWidth: 2.4,
  plaqueWidth: 1.9,
  plaqueHeight: 0.78,
} as const;

export type SurfaceKind = "wall" | "floor" | "ceiling";

export interface MuseumSurface {
  key: string;
  kind: SurfaceKind;
  position: Vec3;
  size: Vec3;
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
  caption: string;
}

export interface MuseumAlcove {
  key: string;
  side: -1 | 1;
  centreZ: number;
  surfaces: MuseumSurface[];
  artworks: MuseumArtwork[];
}

export interface MuseumHall {
  slug: string;
  name: string;
  number: string;
  zNear: number;
  zFar: number;
  surfaces: MuseumSurface[];
  artworks: MuseumArtwork[];
  alcoves: MuseumAlcove[];
  plaque: { position: Vec3; rotationY: number; text: string };
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

interface ZGap {
  near: number;
  far: number;
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

function artwork(entry: PhotoEntry, position: Vec3, rotationY: number): MuseumArtwork {
  const { width, height } = artSize(entry.photo);
  return {
    key: `art-${entry.index}`,
    index: entry.index,
    photo: entry.photo,
    position,
    rotationY,
    width,
    height,
    caption: entry.photo.alt,
  };
}

/** Solid portions of a side wall, leaving openings where alcoves attach. */
function sideSegments(zNear: number, zFar: number, gaps: ZGap[], side: -1 | 1, prefix: string): MuseumSurface[] {
  const x = side * MUSEUM.hallWidth / 2;
  let cursor = zNear;
  const spans: [number, number][] = [];
  for (const gap of [...gaps].sort((a, b) => b.near - a.near)) {
    if (gap.near < cursor) spans.push([cursor, gap.near]);
    cursor = Math.min(cursor, gap.far);
  }
  if (cursor > zFar) spans.push([cursor, zFar]);
  return spans.map(([near, far], i) => ({
    key: `${prefix}-${i}`,
    kind: "wall" as const,
    position: [x, MUSEUM.hallHeight / 2, (near + far) / 2] as Vec3,
    size: [MUSEUM.wallThickness, MUSEUM.hallHeight, Math.abs(near - far)] as Vec3,
  }));
}

/** End wall: solid, or two jambs plus a lintel around a doorway. */
function endWall(z: number, doorway: boolean, key: string): MuseumSurface[] {
  const { hallWidth: w, hallHeight: h, wallThickness: t, doorWidth: d, doorHeight: dh } = MUSEUM;
  if (!doorway) return [{ key, kind: "wall", position: [0, h / 2, z], size: [w, h, t] }];
  const jamb = (w - d) / 2;
  return [
    { key: `${key}-l`, kind: "wall", position: [-(d + jamb) / 2, h / 2, z], size: [jamb, h, t] },
    { key: `${key}-r`, kind: "wall", position: [(d + jamb) / 2, h / 2, z], size: [jamb, h, t] },
    { key: `${key}-top`, kind: "wall", position: [0, (dh + h) / 2, z], size: [d, h - dh, t] },
  ];
}

function alcoveSurfaces(side: -1 | 1, centreZ: number, key: string): MuseumSurface[] {
  const { hallWidth, hallHeight, wallThickness: t, alcoveDepth: depth, alcoveLength: length } = MUSEUM;
  const outerX = side * (hallWidth / 2 + depth);
  const midX = side * (hallWidth / 2 + depth / 2);
  return [
    { key: `${key}-back`, kind: "wall", position: [outerX, hallHeight / 2, centreZ], size: [t, hallHeight, length] },
    { key: `${key}-near`, kind: "wall", position: [midX, hallHeight / 2, centreZ + length / 2], size: [depth + t, hallHeight, t] },
    { key: `${key}-far`, kind: "wall", position: [midX, hallHeight / 2, centreZ - length / 2], size: [depth + t, hallHeight, t] },
    { key: `${key}-floor`, kind: "floor", position: [midX, 0, centreZ], size: [depth, 0.16, length] },
    { key: `${key}-ceiling`, kind: "ceiling", position: [midX, hallHeight, centreZ], size: [depth, 0.16, length] },
  ];
}

function twoDigits(n: number, lang: Locale): string {
  const text = formatNumber(n, lang);
  return text.length < 2 ? `${lang === "ne" ? "०" : "0"}${text}` : text;
}

/**
 * Builds one hall per visible site, laid end to end along -Z. A hall with a following
 * hall gets a doorway in its far wall; the next hall's near wall is omitted so the two
 * spaces connect without overlapping geometry.
 */
export function buildMuseumLayout(rooms: MuseumRoomInput[], photos: GalleryPhoto[], lang: Locale): MuseumHall[] {
  const { hallWidth, hallHeight, artCentreY, artSpacing, alcoveDoorWidth, alcoveLength } = MUSEUM;
  const halls: MuseumHall[] = [];
  let zNear = 0;

  rooms.filter((room) => room.visible).forEach((room, roomIndex) => {
    const entries: PhotoEntry[] = [];
    photos.forEach((photo, index) => {
      if (photo.site === room.slug) entries.push({ photo, index });
    });

    // A few small alcoves break up the long halls; the rest of the photos hang in the hall itself.
    const alcoveCount = Math.min(3, Math.floor(entries.length / 7));
    const perAlcove = alcoveCount > 0 ? Math.min(4, Math.floor(entries.length / (alcoveCount + 1))) : 0;
    const hallEntries = entries.slice(0, entries.length - alcoveCount * perAlcove);
    const alcoveEntries = entries.slice(entries.length - alcoveCount * perAlcove);

    const perSide = Math.ceil(hallEntries.length / 2);
    const length = Math.max(12, perSide * artSpacing + 4);
    const zFar = zNear - length;
    const centreZ = (zNear + zFar) / 2;
    const prefix = `hall-${room.slug}`;

    const alcoveFractions = [0.32, 0.61, 0.84];
    const alcoves: MuseumAlcove[] = Array.from({ length: alcoveCount }, (_, i) => {
      const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
      const aZ = zNear - length * alcoveFractions[i];
      const key = `${prefix}-alcove-${i}`;
      const group = alcoveEntries.slice(i * perAlcove, (i + 1) * perAlcove);
      const outerX = side * (hallWidth / 2 + MUSEUM.alcoveDepth);
      const midX = side * (hallWidth / 2 + MUSEUM.alcoveDepth / 2);
      const items = group.map((entry, j): MuseumArtwork => {
        if (j === 0) return artwork(entry, [outerX - side * 0.06, artCentreY, aZ + alcoveLength / 4], side === -1 ? Math.PI / 2 : -Math.PI / 2);
        if (j === 1) return artwork(entry, [outerX - side * 0.06, artCentreY, aZ - alcoveLength / 4], side === -1 ? Math.PI / 2 : -Math.PI / 2);
        if (j === 2) return artwork(entry, [midX, artCentreY, aZ + alcoveLength / 2 - 0.06], Math.PI);
        return artwork(entry, [midX, artCentreY, aZ - alcoveLength / 2 + 0.06], 0);
      });
      return { key, side, centreZ: aZ, surfaces: alcoveSurfaces(side, aZ, key), artworks: items };
    });

    const gaps: ZGap[] = alcoves.map((a) => ({ near: a.centreZ + alcoveDoorWidth / 2, far: a.centreZ - alcoveDoorWidth / 2 }));
    const surfaces: MuseumSurface[] = [
      { key: `${prefix}-floor`, kind: "floor", position: [0, 0, centreZ], size: [hallWidth, 0.16, length] },
      { key: `${prefix}-ceiling`, kind: "ceiling", position: [0, hallHeight, centreZ], size: [hallWidth, 0.16, length] },
      ...sideSegments(zNear, zFar, gaps.filter((_, i) => alcoves[i].side === -1), -1, `${prefix}-left`),
      ...sideSegments(zNear, zFar, gaps.filter((_, i) => alcoves[i].side === 1), 1, `${prefix}-right`),
      ...(roomIndex === 0 ? endWall(zNear, false, `${prefix}-entrance`) : []),
      ...endWall(zFar, roomIndex < rooms.filter((r) => r.visible).length - 1, `${prefix}-exit`),
    ];

    const artworks: MuseumArtwork[] = [];
    let leftZ = zNear - 2.2;
    let rightZ = zNear - 2.2;
    hallEntries.forEach((entry, i) => {
      const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
      const z = side === -1 ? leftZ : rightZ;
      if (side === -1) leftZ -= artSpacing;
      else rightZ -= artSpacing;
      if (z < zFar + 1.2) return;
      // Do not hang a frame across an alcove opening on the same wall.
      if (gaps.some((gap, gi) => alcoves[gi].side === side && z <= gap.near + 0.4 && z >= gap.far - 0.4)) return;
      artworks.push(artwork(entry, [side * (hallWidth / 2 - 0.06), artCentreY, z], side === -1 ? Math.PI / 2 : -Math.PI / 2));
    });

    const lights: Vec3[] = [];
    for (let z = zNear - 3; z > zFar; z -= 7) lights.push([0, hallHeight - 0.5, z]);

    const number = room.number || twoDigits(roomIndex + 1, lang);
    halls.push({
      slug: room.slug,
      name: room.name,
      number,
      zNear,
      zFar,
      surfaces,
      artworks,
      alcoves,
      plaque: {
        position: [-(hallWidth / 2 - 0.06), 2.85, zNear - 3.2],
        rotationY: Math.PI / 2,
        text: `${number}  ${room.name}`,
      },
      lights,
      urls: [...artworks, ...alcoves.flatMap((a) => a.artworks)].map((a) => a.photo.thumb.src),
    });
    zNear = zFar;
  });

  return halls;
}

/* ---- Navigation (phase 3): pure geometry, no renderer imports ---- */

export interface CameraPose {
  x: number;
  z: number;
  yaw: number;
  pitch: number;
}

/** Match the static scene's opening view; the camera never starts behind a wall. */
export const INITIAL_POSE: CameraPose = { x: -0.8, z: -0.5, yaw: 0, pitch: 0 };

interface WalkRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function contains(rect: WalkRect, x: number, z: number): boolean {
  return x >= rect.minX && x <= rect.maxX && z >= rect.minZ && z <= rect.maxZ;
}

/**
 * The walkable footprint is the union of axis-aligned rectangles: each hall interior, the narrow
 * connector through every end doorway, and each alcove plus the bridge through its side opening.
 * The body radius is already subtracted, so a point in a rectangle cannot touch a wall or frame.
 * Keeping this in the layout module means collision can be reasoned about without WebGL.
 */
export function walkableRects(halls: MuseumHall[], radius = 0.28): WalkRect[] {
  const { hallWidth, doorWidth, alcoveDepth, alcoveLength, alcoveDoorWidth } = MUSEUM;
  const half = hallWidth / 2;
  const rects: WalkRect[] = [];
  halls.forEach((hall, index) => {
    rects.push({
      minX: -half + radius,
      maxX: half - radius,
      minZ: hall.zFar + radius,
      maxZ: hall.zNear - radius,
    });
    if (index < halls.length - 1) {
      // The next hall starts at this hall's far wall; bridge the two interiors at the doorway.
      rects.push({
        minX: -doorWidth / 2 + radius,
        maxX: doorWidth / 2 - radius,
        minZ: hall.zFar - radius - 0.1,
        maxZ: hall.zFar + radius + 0.1,
      });
    }
    hall.alcoves.forEach((alcove) => {
      const wall = alcove.side * half;
      const outer = alcove.side * (half + alcoveDepth);
      rects.push({
        minX: Math.min(wall, outer) + radius,
        maxX: Math.max(wall, outer) - radius,
        minZ: alcove.centreZ - alcoveLength / 2 + radius,
        maxZ: alcove.centreZ + alcoveLength / 2 - radius,
      });
      const bridge = radius + 0.14;
      rects.push({
        minX: wall - bridge,
        maxX: wall + bridge,
        minZ: alcove.centreZ - alcoveDoorWidth / 2 + radius,
        maxZ: alcove.centreZ + alcoveDoorWidth / 2 - radius,
      });
    });
  });
  return rects;
}

export function isMuseumWalkable(halls: MuseumHall[], x: number, z: number, radius = 0.28): boolean {
  return walkableRects(halls, radius).some((rect) => contains(rect, x, z));
}

/**
 * Move from `from` towards `to` in short steps, sliding along walls instead of crossing them.
 * Stepping (rather than a single end-point test) is what keeps a large wheel delta or a filter
 * transition from tunnelling through a solid wall into the next hall.
 */
export function clipMuseumPosition(
  halls: MuseumHall[],
  from: [number, number],
  to: [number, number],
  radius = 0.28,
): [number, number] {
  const rects = walkableRects(halls, radius);
  const walkable = (x: number, z: number) => rects.some((rect) => contains(rect, x, z));
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
export function orderedArtworks(halls: MuseumHall[]): MuseumArtwork[] {
  return halls
    .flatMap((hall) => [...hall.artworks, ...hall.alcoves.flatMap((alcove) => alcove.artworks)])
    .sort((a, b) => a.index - b.index);
}

/** Stand in front of a frame and look straight at it: local +z of the frame points into the room. */
export function artworkPose(art: MuseumArtwork, distance = 1.9): CameraPose {
  return {
    x: art.position[0] + Math.sin(art.rotationY) * distance,
    z: art.position[2] + Math.cos(art.rotationY) * distance,
    yaw: art.rotationY,
    pitch: 0,
  };
}

export function hallEntryPose(hall: MuseumHall): CameraPose {
  return { x: 0, z: hall.zNear - 2.4, yaw: 0, pitch: 0 };
}

export function hallOfArtwork(halls: MuseumHall[], index: number): MuseumHall | null {
  return (
    halls.find((hall) =>
      [...hall.artworks, ...hall.alcoves.flatMap((alcove) => alcove.artworks)].some((art) => art.index === index),
    ) ?? null
  );
}

export function firstIndexInHall(hall: MuseumHall): number | null {
  const arts = [...hall.artworks, ...hall.alcoves.flatMap((alcove) => alcove.artworks)];
  return arts.length ? Math.min(...arts.map((art) => art.index)) : null;
}
