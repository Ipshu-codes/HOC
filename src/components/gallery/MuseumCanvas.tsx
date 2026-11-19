"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

import { formatNumber } from "@/lib/format";
import type { GalleryPhoto } from "@/lib/images";
import {
  COMPACT_INITIAL_POSE,
  INITIAL_POSE,
  MUSEUM,
  artworkPose,
  buildMuseumLayout,
  clampPose,
  moveAlongPath,
  normalizeHeading,
  orderedArtworks,
  pathPoint,
  pathYaw,
  type CameraPose,
  type MuseumArtwork,
  type MuseumLayout,
  type MuseumRoomInput,
  type ScreenRect,
} from "@/lib/museum-layout";
import type { Locale } from "@/types/locale";
import MuseumScene from "./MuseumScene";

interface MuseumCanvasProps {
  /** All photos for this build; `filter` picks the flat, shown subset (indices match PhotoView). */
  photos: GalleryPhoto[];
  sites: { slug: string; name: string }[];
  filter: string;
  lang: Locale;
  /** False while PhotoView is open: the camera keeps its pose but stops taking input. */
  enabled: boolean;
  reducedMotion: boolean;
  compact: boolean;
  activeIndex: number;
  help: string;
  forwardLabel: string;
  backLabel: string;
  leftLabel: string;
  rightLabel: string;
  /** Lives in Gallery, so opening PhotoView or switching layouts never resets the camera. */
  poseRef: MutableRefObject<CameraPose>;
  /** Called once the WebGL renderer exists, so Gallery can clear its loading state. */
  onReady?: () => void;
  /** Incremented when a DOM frame asks the camera to look at it. */
  focusNonce: number;
  onActiveIndex: (index: number) => void;
  onFocusArtwork: (index: number) => void;
  /** A raycast hit on a frame opens the gallery's one photo view. */
  onOpenArtwork: (index: number) => void;
  /** Context loss or a renderer error switches Gallery to the hanging-memory fallback. */
  onFail: () => void;
  /** Gallery fills this with a live projection of every mounted frame before opening PhotoView. */
  projectionRef: MutableRefObject<(() => Record<number, ScreenRect>) | null>;
}

interface ControlsProps extends Omit<MuseumCanvasProps, "photos" | "sites" | "lang"> {
  layout: MuseumLayout;
  artworks: MuseumArtwork[];
  gesture: MutableRefObject<MuseumGesture>;
  /** Touch buttons call into the same camera steering as dragging and keyboard movement. */
  navRef: MutableRefObject<MuseumNavActions | null>;
}

interface MuseumNavActions {
  move: (action: "forward" | "backward") => void;
  turn: (direction: "left" | "right") => void;
}

interface MuseumGesture {
  /** Set once a pointer travels far enough that its release must not count as a frame click. */
  moved: boolean;
}

type MoveAction = "forward" | "backward" | "left" | "right";

/** Thumbnails start nearest the visitor, then fill the rest of the corridor in small idle batches. */
const LOAD_WINDOW = 6;
const COMPACT_LOAD_WINDOW = 4;
const BACKGROUND_BATCH = 4;
const COMPACT_BACKGROUND_BATCH = 2;
const BACKGROUND_DELAY_MS = 220;
const COMPACT_BACKGROUND_DELAY_MS = 420;
const FIRST_BATCH_DELAY_MS = 600;

function nearbyArtworkIndices(activeIndex: number, count: number, loadWindow = LOAD_WINDOW): number[] {
  if (count === 0) return [];
  const start = Math.max(0, activeIndex - loadWindow);
  const end = Math.min(count - 1, activeIndex + loadWindow);
  const indices: number[] = [];
  for (let index = start; index <= end; index += 1) indices.push(index);
  return indices;
}

function twoDigits(n: number, lang: Locale): string {
  const text = formatNumber(n, lang);
  return text.length < 2 ? `${lang === "ne" ? "०" : "0"}${text}` : text;
}

/** Codes keep W/A/S/D stable; arrows use `key` because their codes are layout-independent. */
function movementAction(event: KeyboardEvent): MoveAction | null {
  switch (event.code) {
    case "KeyW":
      return "forward";
    case "KeyS":
      return "backward";
    case "KeyA":
      return "left";
    case "KeyD":
      return "right";
  }
  switch (event.key) {
    case "ArrowUp":
      return "forward";
    case "ArrowDown":
      return "backward";
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
  }
  return null;
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']"));
}

/** Real controls keep their own keyboard behaviour; accessible artwork frames stay navigable. */
function isGuardedControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest(".photo-view, .view-pill, .filter-tabs, .list-row, .museum-hud")) return true;
  return Boolean(target.closest("button, a, [role='button']")) && !target.closest(".wall-frame");
}

/** Portrait phones need a wider vertical field of view to keep both walls in frame. */
function ResponsiveCamera({ compact }: { compact: boolean }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    if (typeof perspective.fov !== "number") return;
    const aspect = size.width / Math.max(1, size.height);
    const horizontal = (58 * Math.PI) / 180;
    const portraitFov = (2 * Math.atan(Math.tan(horizontal / 2) / aspect) * 180) / Math.PI;
    const fov = compact && aspect < 1 ? Math.min(104, Math.max(78, portraitFov)) : 66;
    if (perspective.fov !== fov) {
      // R3F owns this Three.js camera; resizing its projection is the supported path.
      // eslint-disable-next-line react-hooks/immutability
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
      invalidate();
    }
  }, [camera, compact, invalidate, size.width, size.height]);
  return null;
}

/**
 * Mouse, wheel, touch and keyboard navigation. All state is in refs: no React render per drag frame.
 */
function MuseumControls({
  layout,
  artworks,
  enabled,
  reducedMotion,
  activeIndex,
  compact,
  poseRef,
  focusNonce,
  onActiveIndex,
  gesture,
  navRef,
}: ControlsProps) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);

  // Refs start from constants; the preserved pose is copied in the mount effect below (reading
  // poseRef.current during render would break React's render rules). No per-frame React state.
  const target = useRef<CameraPose>({ ...(compact ? COMPACT_INITIAL_POSE : INITIAL_POSE) });
  const currentIndex = useRef(activeIndex);
  const pointers = useRef(new Map<number, { x: number; y: number; startX: number; startY: number }>());
  const pinch = useRef<number | null>(null);
  const handledNonce = useRef(focusNonce);
  const pressed = useRef(new Set<MoveAction>());
  const initialised = useRef(false);

  useEffect(() => {
    currentIndex.current = activeIndex;
  }, [activeIndex]);

  // On first mount, resume the pose Gallery kept while PhotoView or a layout switch unmounted us.
  // On a later layout change, only clamp the goal when the new hall makes it invalid; damping
  // then eases the camera back instead of teleporting to the entrance.
  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      // Gallery keeps the pose across PhotoView/layout switches. Only its untouched initial value is
      // replaced on compact screens, so a fresh visit starts a little further back in the same hall.
      const untouched =
        poseRef.current.s === INITIAL_POSE.s &&
        poseRef.current.lateral === INITIAL_POSE.lateral &&
        poseRef.current.heading === 0 &&
        poseRef.current.pitch === 0;
      const pose = clampPose(layout, compact && untouched ? COMPACT_INITIAL_POSE : poseRef.current);
      target.current = { ...pose };
      poseRef.current = { ...pose };
      const position = pathPoint(layout, pose.s, pose.lateral, MUSEUM.eyeHeight);
      camera.position.set(position[0], position[1], position[2]);
      camera.rotation.set(pose.pitch, pathYaw(layout, pose.s) + pose.heading, 0, "YXZ");
      invalidate();
      return;
    }
    const clamped = clampPose(layout, target.current);
    if (clamped.s !== target.current.s || clamped.lateral !== target.current.lateral) {
      target.current = { ...target.current, s: clamped.s, lateral: clamped.lateral };
      invalidate();
    }
  }, [layout, poseRef, camera, invalidate, compact]);

  const steer = useCallback(
    (pose: CameraPose) => {
      target.current = { ...clampPose(layout, pose) };
      invalidate();
    },
    [layout, invalidate],
  );

  const steerToArtwork = useCallback(
    (index: number) => {
      const art = artworks.find((item) => item.index === index);
      if (art) steer(artworkPose(layout, art));
    },
    [artworks, layout, steer],
  );

  // A focused DOM frame asks the camera to look at its 3D counterpart. The nonce guard keeps a
  // filter/language re-render from steering on its own; only a fresh focus request does that.
  useEffect(() => {
    if (focusNonce === handledNonce.current) return;
    handledNonce.current = focusNonce;
    steerToArtwork(activeIndex);
  }, [focusNonce, activeIndex, steerToArtwork]);

  // Movement is keyed independently of yaw: strafing never rotates the camera. Modify keys and
  // page controls are ignored, and every release/blur clears held keys so motion cannot stick.
  useEffect(() => {
    if (!enabled) {
      pressed.current.clear();
      return;
    }
    const clear = () => {
      if (pressed.current.size === 0) return;
      pressed.current.clear();
      invalidate();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (isEditableTarget(event.target) || isGuardedControl(event.target)) return;
      const action = movementAction(event);
      if (!action) return;
      event.preventDefault();
      pressed.current.add(action);
      invalidate();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const action = movementAction(event);
      if (!action) return;
      pressed.current.delete(action);
    };
    const onVisibility = () => {
      if (document.hidden) clear();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", onVisibility);
      clear();
    };
  }, [enabled, invalidate]);

  /** Move one discrete step, clipped by the hall footprint. The path-local vector is independent of
   *  pitch, so strafing never rotates the view. Shared by keys, pinch, wheel and the touch buttons. */
  const move = useCallback(
    (action: MoveAction, step: number) => {
      const forward = action === "forward" ? 1 : action === "backward" ? -1 : 0;
      const strafe = action === "right" ? 1 : action === "left" ? -1 : 0;
      target.current = moveAlongPath(layout, target.current, forward, strafe, step);
      invalidate();
    },
    [layout, invalidate],
  );

  const moveForward = useCallback(
    (step: number) => move(step < 0 ? "backward" : "forward", Math.abs(step)),
    [move],
  );

  const turn = useCallback(
    (direction: "left" | "right") => {
      const delta = direction === "left" ? Math.PI / 8 : -Math.PI / 8;
      target.current = { ...target.current, heading: normalizeHeading(target.current.heading + delta) };
      invalidate();
    },
    [invalidate],
  );

  // The compact HUD calls into the same steering as dragging and the keyboard. Ref registration
  // happens after mount and is cleared when the lightbox disables camera input.
  useEffect(() => {
    navRef.current = enabled
      ? {
          move: (action) => move(action, 1.45),
          turn,
        }
      : null;
    return () => {
      navRef.current = null;
    };
  }, [enabled, move, turn, navRef]);

  // Pointer: one finger/mouse button looks around; two fingers pinch to walk. Pointer capture keeps
  // a drag alive outside the canvas, and `touch-action: none` (CSS) stops the page scrolling under it.
  // The drag flag survives pointerup so the click that follows a drag cannot select a frame.
  useEffect(() => {
    const element = gl.domElement;
    if (!enabled) return;
    // Keep a stable local reference so cleanup releases exactly the pointers this effect tracked.
    const activePointers = pointers.current;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (activePointers.size === 0) gesture.current.moved = false;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
      element.setPointerCapture(event.pointerId);
      if (activePointers.size === 2) {
        const [a, b] = [...activePointers.values()];
        pinch.current = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const previous = activePointers.get(event.pointerId);
      if (!previous) return;
      if (Math.hypot(event.clientX - previous.startX, event.clientY - previous.startY) > 6) gesture.current.moved = true;
      activePointers.set(event.pointerId, { ...previous, x: event.clientX, y: event.clientY });
      if (activePointers.size >= 2) {
        const [a, b] = [...activePointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch.current !== null) moveForward((distance - pinch.current) * 0.012);
        pinch.current = distance;
        return;
      }
      target.current = {
        ...target.current,
        heading: normalizeHeading(target.current.heading - (event.clientX - previous.x) * 0.0032),
        pitch: Math.max(-1.05, Math.min(1.05, target.current.pitch - (event.clientY - previous.y) * 0.0026)),
      };
      invalidate();
    };

    const onPointerUp = (event: PointerEvent) => {
      activePointers.delete(event.pointerId);
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      if (activePointers.size < 2) pinch.current = null;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const notch = Math.max(-1, Math.min(1, event.deltaY / 100));
      if (notch !== 0) moveForward(notch * 0.9);
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
      element.removeEventListener("wheel", onWheel);
      for (const id of activePointers.keys()) {
        if (element.hasPointerCapture(id)) element.releasePointerCapture(id);
      }
      activePointers.clear();
      pinch.current = null;
    };
  }, [gl, enabled, invalidate, moveForward, gesture]);

  // Damping runs inside useFrame. With frameloop="demand", invalidate() here is what keeps the
  // transition alive until it settles; once still, the scene costs no frames.
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    if (enabled && pressed.current.size > 0) {
      let forward = 0;
      let strafe = 0;
      if (pressed.current.has("forward")) forward += 1;
      if (pressed.current.has("backward")) forward -= 1;
      if (pressed.current.has("right")) strafe += 1;
      if (pressed.current.has("left")) strafe -= 1;
      if (forward !== 0 || strafe !== 0) {
        const length = Math.hypot(forward, strafe);
        target.current = moveAlongPath(layout, target.current, forward / length, strafe / length, 2.7 * dt);
      }
    }

    const pose = poseRef.current;
    const goal = target.current;
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 7);
    let dheading = goal.heading - pose.heading;
    while (dheading > Math.PI) dheading -= Math.PI * 2;
    while (dheading < -Math.PI) dheading += Math.PI * 2;
    pose.s += (goal.s - pose.s) * k;
    pose.lateral += (goal.lateral - pose.lateral) * k;
    pose.heading += dheading * k;
    pose.pitch += (goal.pitch - pose.pitch) * k;

    const position = pathPoint(layout, pose.s, pose.lateral, MUSEUM.eyeHeight);
    camera.position.set(position[0], position[1], position[2]);
    camera.rotation.set(pose.pitch, pathYaw(layout, pose.s) + pose.heading, 0, "YXZ");

    const moving =
      pressed.current.size > 0 ||
      Math.abs(goal.s - pose.s) +
        Math.abs(goal.lateral - pose.lateral) +
        Math.abs(dheading) +
        Math.abs(goal.pitch - pose.pitch) >
        0.002;
    if (moving) invalidate();

    let nearest = -1;
    // Larger frames are comfortably viewed from farther back; keep the active index in step.
    let best = 6.2;
    const eye = pathPoint(layout, pose.s, pose.lateral);
    for (const art of artworks) {
      const distance = Math.hypot(eye[0] - art.position[0], eye[2] - art.position[2]);
      if (distance < best) {
        best = distance;
        nearest = art.index;
      }
    }
    if (nearest >= 0 && nearest !== currentIndex.current) {
      currentIndex.current = nearest;
      onActiveIndex(nearest);
    }
  });

  return null;
}

/** Project each mounted frame's world box into canvas pixels, for PhotoView's opening glide. */
function projectArtworkRects(
  objects: Map<number, THREE.Object3D>,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
): Record<number, ScreenRect> {
  const box = new THREE.Box3();
  const point = new THREE.Vector3();
  const bounds = canvas.getBoundingClientRect();
  const rects: Record<number, ScreenRect> = {};
  objects.forEach((object, index) => {
    box.setFromObject(object);
    if (box.isEmpty()) return;
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) {
          point.set(x, y, z).project(camera);
          if (point.z < -1 || point.z > 1) continue;
          const px = bounds.left + (point.x * 0.5 + 0.5) * bounds.width;
          const py = bounds.top + (-point.y * 0.5 + 0.5) * bounds.height;
          left = Math.min(left, px);
          top = Math.min(top, py);
          right = Math.max(right, px);
          bottom = Math.max(bottom, py);
        }
      }
    }
    if (!Number.isFinite(left) || right - left < 2 || bottom - top < 2) return;
    rects[index] = { left, top, width: right - left, height: bottom - top };
  });
  return rects;
}

/** Lives inside Canvas so it can read the live camera and canvas without lifting R3F state. */
function ProjectionBridge({
  objectsRef,
  projectionRef,
}: {
  objectsRef: MutableRefObject<Map<number, THREE.Object3D>>;
  projectionRef: MutableRefObject<(() => Record<number, ScreenRect>) | null>;
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const project = () => projectArtworkRects(objectsRef.current, camera, gl.domElement);
    projectionRef.current = project;
    return () => {
      if (projectionRef.current === project) projectionRef.current = null;
    };
  }, [camera, gl, objectsRef, projectionRef]);
  return null;
}

/**
 * Client-only entry for the 3D museum. The DOM walk (Gallery.tsx) stays in the page as the
 * accessibility tree and the no-WebGL fallback; this layer is the visual implementation of
 * the same view. Rendered with `dynamic(..., { ssr: false })`, so nothing here is prerendered.
 */
export default function MuseumCanvas(props: MuseumCanvasProps) {
  const { photos, filter, lang, activeIndex, compact, onFail } = props;
  const helpId = useId();
  const shown = useMemo(
    () => (filter === "all" ? photos : photos.filter((photo) => photo.site === filter)),
    [photos, filter],
  );
  const rooms = useMemo<MuseumRoomInput[]>(
    () =>
      props.sites.map((site, index) => ({
        slug: site.slug,
        name: site.name,
        number: twoDigits(index + 1, lang),
        visible: filter === "all" || filter === site.slug,
      })),
    [props.sites, filter, lang],
  );
  const layout = useMemo(() => buildMuseumLayout(rooms, shown, lang, compact), [rooms, shown, lang, compact]);
  const artworks = useMemo(() => orderedArtworks(layout), [layout]);
  const loadWindow = compact ? COMPACT_LOAD_WINDOW : LOAD_WINDOW;
  const backgroundBatch = compact ? COMPACT_BACKGROUND_BATCH : BACKGROUND_BATCH;
  const backgroundDelay = compact ? COMPACT_BACKGROUND_DELAY_MS : BACKGROUND_DELAY_MS;

  // Loading priority is a growing set, not a moving window: once a frame has been asked to load it
  // keeps its texture for as long as it is mounted. A new exhibition (filter/language/photo set)
  // starts a fresh set; navigation only adds nearby frames, so distant frames never go blank.
  const exhibitionKey = useMemo(() => shown.map((photo) => photo.thumb.src).join("\u0000"), [shown]);
  const [backgroundIndices, setBackgroundIndices] = useState(() => ({
    key: exhibitionKey,
    indices: new Set(nearbyArtworkIndices(activeIndex, artworks.length, loadWindow)),
  }));
  const loadingIndices = useMemo(() => {
    const base =
      backgroundIndices.key === exhibitionKey
        ? backgroundIndices.indices
        : new Set(nearbyArtworkIndices(activeIndex, artworks.length, loadWindow));
    // Derived during render so walking adds the newly nearby frames without a cascading render.
    const next = new Set(base);
    for (const index of nearbyArtworkIndices(activeIndex, artworks.length, loadWindow)) next.add(index);
    return next;
  }, [backgroundIndices, exhibitionKey, activeIndex, artworks.length, loadWindow]);

  // After the first nearby group has had time to decode, fill the remaining frames a few at a time.
  useEffect(() => {
    if (loadingIndices.size >= artworks.length) return;
    const isFirstBatch = loadingIndices.size === nearbyArtworkIndices(activeIndex, artworks.length, loadWindow).length;
    const timer = window.setTimeout(() => {
      setBackgroundIndices((previous) => {
        const base = previous.key === exhibitionKey ? previous.indices : loadingIndices;
        const next = new Set(base);
        if (next.size >= artworks.length) {
          return previous.key === exhibitionKey ? previous : { key: exhibitionKey, indices: next };
        }
        const pending: number[] = [];
        for (let index = 0; index < artworks.length; index += 1) {
          if (!next.has(index)) pending.push(index);
        }
        pending.sort((a, b) => Math.abs(a - activeIndex) - Math.abs(b - activeIndex) || a - b);
        for (const index of pending.slice(0, backgroundBatch)) next.add(index);
        if (previous.key === exhibitionKey && next.size === base.size) return previous;
        return { key: exhibitionKey, indices: next };
      });
    }, isFirstBatch ? FIRST_BATCH_DELAY_MS : backgroundDelay);
    return () => window.clearTimeout(timer);
  }, [loadingIndices, artworks.length, exhibitionKey, activeIndex, backgroundBatch, backgroundDelay, loadWindow]);

  const gesture = useRef<MuseumGesture>({ moved: false });
  const navRef = useRef<MuseumNavActions | null>(null);
  const objectsRef = useRef(new Map<number, THREE.Object3D>());
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const failed = useRef(false);
  const fail = useCallback(() => {
    if (failed.current) return;
    failed.current = true;
    onFail();
  }, [onFail]);

  useEffect(
    () => () => {
      if (canvasRef.current) canvasRef.current.style.cursor = "";
      canvasRef.current?.removeEventListener("webglcontextlost", fail);
    },
    [fail],
  );

  const initialPose = compact ? COMPACT_INITIAL_POSE : INITIAL_POSE;
  const initialPosition = pathPoint(layout, initialPose.s, initialPose.lateral, MUSEUM.eyeHeight);

  return (
    <div className="museum-canvas gallery-museum">
      <div className="museum-render" aria-hidden="true">
        <Canvas
          frameloop="demand"
          dpr={compact ? [1, 1.25] : [1, 1.5]}
          gl={{
            antialias: !compact,
            alpha: false,
            stencil: false,
            powerPreference: compact ? "default" : "high-performance",
          }}
          // The camera starts at the open entrance and looks along the curved centreline. The
          // compact pose sits a little further back; ResponsiveCamera widens the field of view.
          camera={{
            position: initialPosition,
            rotation: [0, pathYaw(layout, initialPose.s), 0],
            fov: compact ? 82 : 66,
            near: 0.1,
            far: 260,
          }}
          onCreated={({ gl, invalidate }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            canvasRef.current = gl.domElement;
            gl.domElement.addEventListener("webglcontextlost", fail, { once: true });
            invalidate();
            props.onReady?.();
          }}
        >
          <color attach="background" args={["#f3ede2"]} />
          <ResponsiveCamera compact={compact} />
          <MuseumControls {...props} layout={layout} artworks={artworks} gesture={gesture} navRef={navRef} />
          <MuseumScene
            layout={layout}
            loadingIndices={loadingIndices}
            activeIndex={activeIndex}
            hoverIndex={props.enabled ? hoverIndex : null}
            interactive={props.enabled}
            compact={compact}
            gesture={gesture}
            objectsRef={objectsRef}
            onHover={setHoverIndex}
            onSelect={props.onOpenArtwork}
          />
          <ProjectionBridge objectsRef={objectsRef} projectionRef={props.projectionRef} />
        </Canvas>
      </div>
      {compact && (
        <div className="museum-hud">
          <p className="museum-help" id={helpId}>
            {props.help}
          </p>
          <div className="museum-nav" role="group" aria-describedby={helpId}>
            <button
              type="button"
              className="museum-nav-button museum-nav-left"
              aria-label={props.leftLabel}
              disabled={!props.enabled}
              onClick={() => navRef.current?.turn("left")}
            >
              <span aria-hidden="true">↶</span>
            </button>
            <button
              type="button"
              className="museum-nav-button museum-nav-forward"
              aria-label={props.forwardLabel}
              disabled={!props.enabled}
              onClick={() => navRef.current?.move("forward")}
            >
              <span aria-hidden="true">↑</span>
            </button>
            <button
              type="button"
              className="museum-nav-button museum-nav-back"
              aria-label={props.backLabel}
              disabled={!props.enabled}
              onClick={() => navRef.current?.move("backward")}
            >
              <span aria-hidden="true">↓</span>
            </button>
            <button
              type="button"
              className="museum-nav-button museum-nav-right"
              aria-label={props.rightLabel}
              disabled={!props.enabled}
              onClick={() => navRef.current?.turn("right")}
            >
              <span aria-hidden="true">↷</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
