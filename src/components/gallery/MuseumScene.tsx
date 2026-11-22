"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

import type { GalleryPhoto } from "@/lib/images";
import {
  MUSEUM,
  pathFrame,
  pathPoint,
  pathYaw,
  type MuseumArtwork,
  type MuseumDescriptionPanel,
  type MuseumLayout,
  type MuseumMarker,
  type Vec3,
} from "@/lib/museum-layout";
import type { MuseumDisplay, MuseumLink, MuseumSegment, MuseumSign, MuseumWorld } from "@/lib/museum-world";
import {
  CARPET_TILE,
  useCarpetTexture,
  useMuseumDescriptionTexture,
  useMuseumImageTexture,
  useMuseumLinkTexture,
  useMuseumSignTexture,
  useMuseumTextTexture,
} from "./useMuseumTextures";

/** Gallery-scoped neutral palette (mirrors the CSS tokens in globals.css). No site-specific detail. */
const STONE = "#f0e9dd";
const SANDSTONE = "#f4eee3";
const IVORY = "#f7f3ea";
const PANEL = "#e9dfce";
const CONCRETE = "#bdb5a8";
const CHARCOAL = "#272522";
const WOOD = "#4a2e1c";

interface SceneProps {
  world: MuseumWorld;
  /** Growing set of frames whose thumbnails have been requested; loaded ones never go blank. */
  loadingIndices: ReadonlySet<number>;
  activeIndex: number;
  /** The item being looked at closely ("art-3", "map", "logo"); its sharper file loads. */
  focusKey: string | null;
  hoverKey: string | null;
  interactive: boolean;
  compact: boolean;
  reducedMotion: boolean;
  gesture: MutableRefObject<{ moved: boolean }>;
  onHover: (key: string | null) => void;
  /** "art-<index>", "map", "logo", "sign-<slug>", "link-<key>", "video-<slug>" or "listen-<slug>". */
  onSelect: (key: string) => void;
  /** Wings the visitor has headed for: only these load their video. */
  openWings: ReadonlySet<number>;
  /** True while a page panel covers the museum: the wing videos wait. */
  videoPaused: boolean;
  /** The wing's spoken story is playing: its "Listen" plaque shows it. */
  narrationPlaying: boolean;
}

interface GeometryData {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

const QUAD_UVS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

function emptyGeometryData(): GeometryData {
  return { positions: [], normals: [], uvs: [], indices: [] };
}

function addQuad(data: GeometryData, corners: readonly Vec3[], normals: readonly Vec3[], uvs = QUAD_UVS): void {
  const base = data.positions.length / 3;
  corners.forEach((corner, index) => {
    data.positions.push(corner[0], corner[1], corner[2]);
    const normal = normals[index];
    data.normals.push(normal[0], normal[1], normal[2]);
    data.uvs.push(uvs[index][0], uvs[index][1]);
  });
  data.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function makeGeometry(data: GeometryData): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(data.positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(data.normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(data.uvs, 2));
  geometry.setIndex(data.indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/** The shared sample positions between s0 and s1, with both ends included exactly. */
function samplesWithin(layout: MuseumLayout, s0: number, s1: number): number[] {
  return [s0, ...layout.sampleS.filter((s) => s > s0 + 1e-6 && s < s1 - 1e-6), s1];
}

/** A flat ribbon at height y, `half` metres either side of the centreline, between s0 and s1. */
function buildRibbon(
  layout: MuseumLayout,
  y: number,
  normalY: 1 | -1,
  half: number,
  s0: number,
  s1: number,
  tile = 0,
): THREE.BufferGeometry {
  const data = emptyGeometryData();
  const normal: Vec3 = [0, normalY, 0];
  const samples = samplesWithin(layout, s0, s1);
  for (let index = 0; index < samples.length - 1; index += 1) {
    const a = samples[index];
    const b = samples[index + 1];
    const nearLeft = pathPoint(layout, a, -half, y);
    const nearRight = pathPoint(layout, a, half, y);
    const farRight = pathPoint(layout, b, half, y);
    const farLeft = pathPoint(layout, b, -half, y);
    // With a tile length, v counts metres along the path so the carpet weave repeats evenly.
    const v0 = tile ? (a - s0) / tile : 0;
    const v1 = tile ? (b - s0) / tile : 1;
    const uvs: ReadonlyArray<readonly [number, number]> = [
      [0, v0],
      [1, v0],
      [1, v1],
      [0, v1],
    ];
    // Floor winds near-left → near-right → far-right; ceiling is reversed so its normal points down.
    if (normalY === 1) addQuad(data, [nearLeft, nearRight, farRight, farLeft], [normal, normal, normal, normal], uvs);
    else addQuad(data, [nearLeft, farLeft, farRight, nearRight], [normal, normal, normal, normal]);
  }
  return makeGeometry(data);
}

/** A vertical ribbon on one side of the path. Normals follow the curve and point into the hall. */
function buildWall(layout: MuseumLayout, side: -1 | 1, s0: number, s1: number): THREE.BufferGeometry {
  const data = emptyGeometryData();
  const lateral = side * layout.innerHalfWidth;
  const samples = samplesWithin(layout, s0, s1);
  for (let index = 0; index < samples.length - 1; index += 1) {
    const a = samples[index];
    const b = samples[index + 1];
    const frame0 = pathFrame(layout, a);
    const frame1 = pathFrame(layout, b);
    const inward0: Vec3 = side === -1 ? [frame0.rightX, 0, frame0.rightZ] : [-frame0.rightX, 0, -frame0.rightZ];
    const inward1: Vec3 = side === -1 ? [frame1.rightX, 0, frame1.rightZ] : [-frame1.rightX, 0, -frame1.rightZ];
    const nearBottom = pathPoint(layout, a, lateral, 0);
    const nearTop = pathPoint(layout, a, lateral, MUSEUM.corridorHeight);
    const farTop = pathPoint(layout, b, lateral, MUSEUM.corridorHeight);
    const farBottom = pathPoint(layout, b, lateral, 0);
    if (side === -1) {
      addQuad(data, [nearBottom, farBottom, farTop, nearTop], [inward0, inward1, inward1, inward0]);
    } else {
      addQuad(data, [nearBottom, nearTop, farTop, farBottom], [inward0, inward0, inward1, inward1]);
    }
  }
  return makeGeometry(data);
}

/** The finished far end. It is a straight cross-section, but shares the path's final frame exactly. */
function buildEndCap(layout: MuseumLayout): THREE.BufferGeometry {
  const data = emptyGeometryData();
  const frame = pathFrame(layout, layout.path.end);
  const normal: Vec3 = [-frame.tangentX, 0, -frame.tangentZ];
  const bottomLeft = pathPoint(layout, layout.path.end, -layout.innerHalfWidth, 0);
  const bottomRight = pathPoint(layout, layout.path.end, layout.innerHalfWidth, 0);
  const topRight = pathPoint(layout, layout.path.end, layout.innerHalfWidth, MUSEUM.corridorHeight);
  const topLeft = pathPoint(layout, layout.path.end, -layout.innerHalfWidth, MUSEUM.corridorHeight);
  addQuad(data, [bottomLeft, bottomRight, topRight, topLeft], [normal, normal, normal, normal]);
  return makeGeometry(data);
}

/**
 * One continuous shell. Every surface is generated from the same sampled path, so shared edges have
 * identical vertex positions: no box seams, disconnected sections or intersecting floor/ceiling.
 * Wall spans leave the entrance open where a wing joins it.
 */
/** One ambient video per heritage wing, on the end wall's panel: public/videos/<slug>-video.webm. */
export const WING_VIDEOS: Record<string, string> = {
  "nanak-math": "/videos/nanak-math-video.webm",
  "mhepi-ajima": "/videos/mhepi-ajima-video.webm",
};

/**
 * A wall-mounted display on a wing's end wall playing the site's video, muted, on a loop. Like the
 * wing's photographs, the file is only fetched once the visitor heads for that wing (`active`), and it
 * pauses while a page panel covers the museum. The museum renders on demand, so useFrame redraws at
 * ~30 fps only while the video plays. Under reduced motion the screen stays dark (bezel only).
 * A click opens it larger; MuseumCanvas shows that in the page, outside the 3D scene.
 */
function WingScreen({
  segment,
  active,
  paused,
  reducedMotion,
  hovered,
  interactive,
  gesture,
  onHover,
  onSelect,
}: {
  segment: MuseumSegment;
  active: boolean;
  paused: boolean;
  reducedMotion: boolean;
  hovered: boolean;
  interactive: boolean;
  gesture: MutableRefObject<{ moved: boolean }>;
  onHover: (key: string | null) => void;
  onSelect: (key: string) => void;
}) {
  const src = segment.site ? WING_VIDEOS[segment.site] : undefined;
  const invalidate = useThree((state) => state.invalidate);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pausedRef = useRef(paused);
  const lastFrame = useRef(0);
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null);

  useEffect(() => {
    if (!src || !active || reducedMotion) return;
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    videoRef.current = video;
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    // Show the screen once the first frame is ready; the listener keeps this out of the
    // effect body (setState there would cascade renders).
    const show = () => setTexture(tex);
    video.addEventListener("canplay", show, { once: true });
    if (!pausedRef.current) void video.play().catch(() => undefined);
    invalidate();
    return () => {
      video.pause();
      video.removeEventListener("canplay", show);
      video.removeAttribute("src");
      video.load();
      tex.dispose();
      videoRef.current = null;
      setTexture(null);
    };
  }, [src, active, reducedMotion, invalidate]);

  // Behind a page panel the museum is a still backdrop: the video waits there.
  useEffect(() => {
    pausedRef.current = paused;
    const video = videoRef.current;
    if (!video) return;
    if (paused) video.pause();
    else void video.play().catch(() => undefined);
    invalidate();
  }, [paused, invalidate]);

  useEffect(() => {
    invalidate();
  }, [hovered, invalidate]);

  useFrame(() => {
    const video = videoRef.current;
    if (!video || video.paused || video.readyState < 2) return;
    const now = performance.now();
    if (now - lastFrame.current < 33) return;
    lastFrame.current = now;
    invalidate();
  });

  if (!src || !segment.site) return null;
  // Nearly fill the end panel: small gap at every edge, 16:9 kept, never wider than the panel.
  const panelWidth = segment.layout.corridorWidth * 0.42;
  const panelHeight = MUSEUM.corridorHeight * 0.58;
  const gap = 0.18;
  const frameWidth = Math.min(panelWidth - 2 * gap, ((panelHeight - 2 * gap) * 16) / 9);
  const frameHeight = (frameWidth * 9) / 16;
  const bezel = 0.07;
  // Centred on the end panel's face; local +z faces the visitor (same as signs).
  const position = pathPoint(segment.layout, segment.layout.path.end - 0.12, 0, MUSEUM.corridorHeight / 2 - 0.05);
  const yaw = pathYaw(segment.layout, segment.layout.path.end);
  return (
    <group position={position} rotation={[0, yaw, 0]} {...pointerHandlers(`video-${segment.site}`, interactive, gesture, onHover, onSelect)}>
      <mesh>
        <boxGeometry args={[frameWidth + bezel, frameHeight + bezel, 0.08]} />
        <meshStandardMaterial color={hovered ? "#6b532e" : "#1c1a18"} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[frameWidth, frameHeight]} />
        <meshBasicMaterial map={texture ?? undefined} color={texture ? "#ffffff" : "#0d0b0a"} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CurvedShell({ segment }: { segment: MuseumSegment }) {
  const { layout, wallSpans, endPanel } = segment;
  const geometry = useMemo(() => {
    const { start, end } = layout.path;
    const half = layout.innerHalfWidth;
    const left = wallSpans?.left ?? [start, end];
    const right = wallSpans?.right ?? [start, end];
    return {
      floor: buildRibbon(layout, 0, 1, half, start, end),
      ceiling: buildRibbon(layout, MUSEUM.corridorHeight, -1, half, start, end),
      left: buildWall(layout, -1, left[0], left[1]),
      right: buildWall(layout, 1, right[0], right[1]),
      end: buildEndCap(layout),
    };
  }, [layout, wallSpans]);

  useEffect(
    () => () => {
      Object.values(geometry).forEach((item) => item.dispose());
    },
    [geometry],
  );

  const panelPosition = pathPoint(layout, layout.path.end - 0.06, 0, MUSEUM.corridorHeight / 2);

  return (
    <>
      <mesh geometry={geometry.floor}>
        <meshStandardMaterial color={CONCRETE} roughness={0.96} metalness={0} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={geometry.ceiling}>
        <meshStandardMaterial color={IVORY} roughness={0.98} metalness={0} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={geometry.left}>
        <meshStandardMaterial color={STONE} roughness={0.96} metalness={0} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={geometry.right}>
        <meshStandardMaterial color={SANDSTONE} roughness={0.96} metalness={0} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={geometry.end}>
        <meshStandardMaterial color={IVORY} roughness={0.98} metalness={0} side={THREE.FrontSide} />
      </mesh>
      {endPanel && (
        <group position={panelPosition} rotation={[0, pathYaw(layout, layout.path.end), 0]}>
          <mesh>
            <boxGeometry args={[layout.corridorWidth * 0.42, MUSEUM.corridorHeight * 0.58, MUSEUM.plaqueDepth]} />
            <meshStandardMaterial color={PANEL} roughness={0.94} metalness={0} />
          </mesh>
        </group>
      )}
    </>
  );
}

/** The red carpet down the middle of a hall: a woven burgundy runner with muted gold borders. */
function Carpet({ segment, compact }: { segment: MuseumSegment; compact: boolean }) {
  const texture = useCarpetTexture();
  const invalidate = useThree((state) => state.invalidate);
  const [s0, s1] = segment.carpet;
  const geometry = useMemo(
    () => buildRibbon(segment.layout, 0.006, 1, (compact ? 1.9 : 2.4) / 2, s0, s1, CARPET_TILE),
    [segment.layout, compact, s0, s1],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    if (texture) invalidate();
  }, [texture, invalidate]);
  // Drawn once the weave exists: adding a map to a live material would need a shader rebuild.
  if (!texture) return null;
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  );
}

/** Fade a newly loaded picture in, so photographs appear on the wall rather than pop. */
function useAppear(ready: boolean, reducedMotion: boolean) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const started = useRef<number | null>(null);
  const invalidate = useThree((state) => state.invalidate);
  // Layout effect: the material must be see-through before the first frame that shows it.
  useLayoutEffect(() => {
    if (!ready || !material.current) return;
    material.current.opacity = reducedMotion ? 1 : 0;
    material.current.transparent = !reducedMotion;
    started.current = performance.now();
    invalidate();
  }, [ready, reducedMotion, invalidate]);
  useFrame(() => {
    const item = material.current;
    if (!item || started.current === null) return;
    const t = reducedMotion ? 1 : Math.min(1, (performance.now() - started.current) / 520);
    item.opacity = t;
    item.transparent = t < 1;
    if (t < 1) invalidate();
    else started.current = null;
  });
  return material;
}

/** The photo's own description on a small panel fixed to the wall below its frame. It shares the
 *  artwork's rotation, so it faces the visitor without ever turning to follow the camera. */
function DescriptionPanel({ text, panel, active }: { text: string; panel: MuseumDescriptionPanel; active: boolean }) {
  const { width, height, offsetY } = panel;
  const texture = useMuseumDescriptionTexture(text, panel, active);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (texture) invalidate();
  }, [texture, invalidate]);

  const depth = MUSEUM.descriptionDepth;
  // Sit just inside the frame's front plane so the label reads as part of the same wall unit.
  const panelZ = MUSEUM.frameDepth / 2 - depth / 2 + 0.002;

  return (
    <group position={[0, offsetY, panelZ]}>
      {/* A dark brown mount a little larger than the cream label: a subtle frame, like the prints. */}
      <mesh>
        <boxGeometry args={[width + 0.05, height + 0.05, depth]} />
        <meshStandardMaterial color="#3a2a17" roughness={0.82} metalness={0} />
      </mesh>
      {texture && (
        <mesh position={[0, 0, depth / 2 + 0.001]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

interface PointerHandlers {
  onPointerOver: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (event: ThreeEvent<PointerEvent>) => void;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}

/** Hover and click for one selectable thing; a look-around drag never counts as a click. */
function pointerHandlers(
  key: string,
  interactive: boolean,
  gesture: MutableRefObject<{ moved: boolean }>,
  onHover: (key: string | null) => void,
  onSelect: (key: string) => void,
): PointerHandlers {
  return {
    onPointerOver: (event) => {
      if (!interactive || gesture.current.moved) return;
      event.stopPropagation();
      onHover(key);
    },
    onPointerOut: (event) => {
      if (!interactive) return;
      event.stopPropagation();
      onHover(null);
    },
    onClick: (event) => {
      // A look-around drag ends in a click event too; the gesture flag is the only reliable discriminator.
      if (!interactive || gesture.current.moved) return;
      event.stopPropagation();
      onSelect(key);
    },
  };
}

/** A larger file: `wanted` px wide, or the largest there is. */
function largerFile(photo: GalleryPhoto, wanted: number): string {
  return (photo.full.find((file) => file.width >= wanted) ?? photo.full.at(-1) ?? photo.thumb).src;
}

/** A picture under cream mat and dark frame, kept to its own aspect ratio. */
function FramedPicture({
  width,
  height,
  texture,
  hovered,
  focused,
  transparent,
  reducedMotion,
}: {
  width: number;
  height: number;
  texture: THREE.Texture | null;
  hovered: boolean;
  focused: boolean;
  transparent?: boolean;
  reducedMotion: boolean;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const material = useAppear(texture !== null, reducedMotion);
  useEffect(() => {
    invalidate();
  }, [focused, hovered, texture, invalidate]);
  const mat = MUSEUM.matBorder;
  const frame = MUSEUM.frameBorder;
  const depth = MUSEUM.frameDepth;
  const face = depth / 2;
  return (
    <>
      <mesh>
        <boxGeometry args={[width + 2 * (mat + frame), height + 2 * (mat + frame), depth]} />
        <meshStandardMaterial color={hovered ? "#6b532e" : focused ? "#3a2a17" : CHARCOAL} roughness={0.52} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0, face + 0.001]}>
        <planeGeometry args={[width + 2 * mat, height + 2 * mat]} />
        <meshStandardMaterial color={IVORY} roughness={0.95} metalness={0} />
      </mesh>
      {texture && (
        <mesh position={[0, 0, face + 0.002]}>
          <planeGeometry args={[width, height]} />
          {/* A little emissive keeps prints legible under gallery light without flattening the shading. */}
          <meshStandardMaterial
            ref={material}
            map={texture}
            emissive="#ffffff"
            emissiveMap={texture}
            emissiveIntensity={hovered ? 0.85 : focused ? 0.62 : 0.3}
            roughness={0.9}
            metalness={0}
            alphaTest={transparent ? 0.02 : 0}
          />
        </mesh>
      )}
    </>
  );
}

function FramedArtwork({
  art,
  active,
  focused,
  closeUp,
  near,
  hovered,
  interactive,
  compact,
  reducedMotion,
  gesture,
  onHover,
  onSelect,
}: {
  art: MuseumArtwork;
  active: boolean;
  focused: boolean;
  closeUp: boolean;
  /** One of the frames beside the visitor: worth the 960 px file. */
  near: boolean;
  hovered: boolean;
  interactive: boolean;
  compact: boolean;
  reducedMotion: boolean;
  gesture: MutableRefObject<{ moved: boolean }>;
  onHover: (key: string | null) => void;
  onSelect: (key: string) => void;
}) {
  const thumb = useMuseumImageTexture(art.photo.thumb.src, active);
  // The large prints are shown sharper as the visitor comes near; the largest file only for a close look.
  const nearby = useMuseumImageTexture(largerFile(art.photo, 960), near || closeUp);
  const sharp = useMuseumImageTexture(largerFile(art.photo, compact ? 960 : 1280), closeUp);
  // Nothing hangs until its photograph has arrived: frames appear with their pictures, never empty.
  if (!thumb) return null;
  return (
    <group position={art.position} rotation={[0, art.rotationY, 0]} {...pointerHandlers(art.key, interactive, gesture, onHover, onSelect)}>
      <FramedPicture width={art.width} height={art.height} texture={sharp ?? nearby ?? thumb} hovered={hovered} focused={focused} reducedMotion={reducedMotion} />
      <DescriptionPanel text={art.caption} panel={art.description} active={active} />
    </group>
  );
}

/** The ward map or logo: framed like the photographs, with its existing alt text as the wall label. */
function DisplayFrame({
  display,
  focused,
  hovered,
  interactive,
  reducedMotion,
  gesture,
  onHover,
  onSelect,
}: {
  display: MuseumDisplay;
  focused: boolean;
  hovered: boolean;
  interactive: boolean;
  reducedMotion: boolean;
  gesture: MutableRefObject<{ moved: boolean }>;
  onHover: (key: string | null) => void;
  onSelect: (key: string) => void;
}) {
  const texture = useMuseumImageTexture(display.src, true);
  const sharp = useMuseumImageTexture(display.hiSrc, focused && display.hiSrc !== display.src);
  return (
    <group position={display.position} rotation={[0, display.rotationY, 0]} {...pointerHandlers(display.key, interactive, gesture, onHover, onSelect)}>
      <FramedPicture
        width={display.width}
        height={display.height}
        texture={sharp ?? texture}
        hovered={hovered}
        focused={focused}
        transparent={display.key === "logo"}
        reducedMotion={reducedMotion}
      />
      <DescriptionPanel text={display.alt} panel={display.description} active />
    </group>
  );
}

/** A directional sign: an engraved brass plate on an aged wooden board, standing off the end wall. */
function Signboard({
  sign,
  hovered,
  interactive,
  gesture,
  onHover,
  onSelect,
}: {
  sign: MuseumSign;
  hovered: boolean;
  interactive: boolean;
  gesture: MutableRefObject<{ moved: boolean }>;
  onHover: (key: string | null) => void;
  onSelect: (key: string) => void;
}) {
  const texture = useMuseumSignTexture(sign.label, sign.dir, sign.width, sign.height);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [texture, hovered, invalidate]);
  const board = 0.08;
  const plate = 0.025;
  return (
    <group position={sign.position} rotation={[0, sign.rotationY, 0]} {...pointerHandlers(`sign-${sign.key}`, interactive, gesture, onHover, onSelect)}>
      <mesh position={[0, 0, board / 2]}>
        <boxGeometry args={[sign.width + 0.2, sign.height + 0.2, board]} />
        <meshStandardMaterial color={WOOD} roughness={0.78} metalness={0} />
      </mesh>
      <mesh position={[0, 0, board + plate / 2]}>
        <boxGeometry args={[sign.width, sign.height, plate]} />
        <meshStandardMaterial color="#8f6a24" roughness={0.45} metalness={0.3} />
      </mesh>
      {texture && (
        <mesh position={[0, 0, board + plate + 0.001]}>
          <planeGeometry args={[sign.width, sign.height]} />
          <meshStandardMaterial
            map={texture}
            emissive="#ffffff"
            emissiveMap={texture}
            emissiveIntensity={hovered ? 0.5 : 0.24}
            roughness={0.4}
            metalness={0.22}
          />
        </mesh>
      )}
    </group>
  );
}

/** "Read About →" (and the wing's "Listen"): a small crimson plaque with a gold rule on a dark mount.
 *  It lifts slightly and brightens on hover or keyboard focus, so it reads as something to press; its
 *  mount turns gold while it is `on` (the story playing). */
function LinkPlaque({
  link,
  selectKey,
  icon,
  on = false,
  hovered,
  interactive,
  gesture,
  onHover,
  onSelect,
}: {
  link: Pick<MuseumLink, "text" | "position" | "rotationY" | "width" | "height">;
  selectKey: string;
  icon?: "headphones";
  on?: boolean;
  hovered: boolean;
  interactive: boolean;
  gesture: MutableRefObject<{ moved: boolean }>;
  onHover: (key: string | null) => void;
  onSelect: (key: string) => void;
}) {
  const texture = useMuseumLinkTexture(link.text, link.width, link.height, icon);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [texture, hovered, on, invalidate]);
  const mount = 0.05;
  const lift = hovered ? 0.03 : 0;
  return (
    <group position={link.position} rotation={[0, link.rotationY, 0]} {...pointerHandlers(selectKey, interactive, gesture, onHover, onSelect)}>
      <mesh position={[0, 0, mount / 2]}>
        <boxGeometry args={[link.width + 0.08, link.height + 0.08, mount]} />
        <meshStandardMaterial color={hovered || on ? "#d4a017" : "#3a2a17"} roughness={0.6} metalness={hovered || on ? 0.3 : 0} />
      </mesh>
      {texture && (
        <mesh position={[0, 0, mount + 0.002 + lift]}>
          <planeGeometry args={[link.width, link.height]} />
          <meshStandardMaterial
            map={texture}
            emissive="#ffffff"
            emissiveMap={texture}
            emissiveIntensity={hovered ? 0.75 : 0.4}
            roughness={0.5}
            metalness={0}
          />
        </mesh>
      )}
    </group>
  );
}

/** The site's existing name and number, drawn with the page's own fonts (EN or NE). */
function SitePlaque({ marker }: { marker: MuseumMarker }) {
  const texture = useMuseumTextTexture({ number: marker.number, name: marker.name, lang: marker.lang }, true);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (texture) invalidate();
  }, [texture, invalidate]);
  const depth = MUSEUM.plaqueDepth;
  return (
    <group position={marker.position} rotation={[0, marker.rotationY, 0]}>
      <mesh>
        <boxGeometry args={[MUSEUM.plaqueWidth, MUSEUM.plaqueHeight, depth]} />
        <meshStandardMaterial color={IVORY} roughness={0.9} metalness={0} />
      </mesh>
      {texture && (
        <mesh position={[0, 0, depth / 2 + 0.001]}>
          <planeGeometry args={[MUSEUM.plaqueWidth - 0.08, MUSEUM.plaqueHeight - 0.06]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** The halls; navigation and selection are owned by MuseumCanvas. */
export default function MuseumScene({
  world,
  loadingIndices,
  activeIndex,
  focusKey,
  hoverKey,
  interactive,
  compact,
  reducedMotion,
  gesture,
  onHover,
  onSelect,
  openWings,
  videoPaused,
  narrationPlaying,
}: SceneProps) {
  const item = { interactive, gesture, onHover, onSelect };
  return (
    <>
      <ambientLight intensity={0.7} color="#fff6ea" />
      <hemisphereLight args={["#fff6ea", "#6b6256", 0.5]} />
      <directionalLight position={[2, 6, 4]} intensity={0.6} color="#fff4e4" />
      {world.segments.map((segment, seg) => {
        // Same lighting design, fewer dynamic lights on the small GPU budget: every other fixture is
        // enough to keep the hall even because ambient/hemisphere/directional fill stays unchanged.
        const lights = compact ? segment.layout.lights.filter((_, index) => index % 2 === 0) : segment.layout.lights;
        return (
          <group key={segment.key} position={[segment.x, 0, segment.z]} rotation={[0, segment.yaw, 0]}>
            <CurvedShell segment={segment} />
            {segment.endPanel && segment.site && (
              <WingScreen
                segment={segment}
                active={openWings.has(seg)}
                paused={videoPaused}
                reducedMotion={reducedMotion}
                hovered={hoverKey === `video-${segment.site}`}
                {...item}
              />
            )}
            <Carpet segment={segment} compact={compact} />
            {segment.layout.artworks.map((art) => (
              <FramedArtwork
                key={art.key}
                art={art}
                active={loadingIndices.has(art.index)}
                focused={art.index === activeIndex}
                closeUp={focusKey === art.key}
                near={Math.abs(art.index - activeIndex) <= 1 && loadingIndices.has(art.index)}
                hovered={hoverKey === art.key}
                compact={compact}
                reducedMotion={reducedMotion}
                {...item}
              />
            ))}
            {segment.layout.markers.map((marker) => (
              <SitePlaque key={marker.key} marker={marker} />
            ))}
            {world.displays
              .filter((display) => display.seg === seg)
              .map((display) => (
                <DisplayFrame
                  key={display.key}
                  display={display}
                  focused={focusKey === display.key}
                  hovered={hoverKey === display.key}
                  reducedMotion={reducedMotion}
                  {...item}
                />
              ))}
            {world.signs
              .filter((sign) => sign.seg === seg)
              .map((sign) => (
                <Signboard key={sign.key} sign={sign} hovered={hoverKey === `sign-${sign.key}`} {...item} />
              ))}
            {world.links
              .filter((link) => link.seg === seg)
              .map((link) => (
                <LinkPlaque key={link.key} link={link} selectKey={`link-${link.key}`} hovered={hoverKey === `link-${link.key}`} {...item} />
              ))}
            {world.listen?.seg === seg && (
              <LinkPlaque
                link={world.listen}
                selectKey={`listen-${world.listen.site}`}
                icon="headphones"
                on={narrationPlaying}
                hovered={hoverKey === `listen-${world.listen.site}`}
                {...item}
              />
            )}
            {lights.map((position, index) => (
              <pointLight key={index} position={position} intensity={compact ? 18 : 22} distance={compact ? 14 : 16} decay={2} color="#fff1dc" />
            ))}
          </group>
        );
      })}
    </>
  );
}
