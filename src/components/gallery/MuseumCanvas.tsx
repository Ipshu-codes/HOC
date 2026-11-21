"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

import { formatNumber } from "@/lib/format";
import type { GalleryPhoto } from "@/lib/images";
import {
  COMPACT_INITIAL_POSE,
  INITIAL_POSE,
  MUSEUM,
  artworkPose,
  normalizeHeading,
  type MuseumRoomInput,
} from "@/lib/museum-layout";
import {
  EXHIBIT_START_POSE,
  artworkFocusItem,
  buildExhibitWorld,
  buildHallWorld,
  clampWorldPose,
  convertPose,
  displayFocusItem,
  focusPose,
  moveInWorld,
  poseAt,
  segmentAt,
  viewOf,
  wingEntryPose,
  type ExhibitInput,
  type FocusItem,
  type MuseumWorld,
  type ViewPose,
  type WorldPose,
} from "@/lib/museum-world";
import type { Locale } from "@/types/locale";
import MuseumScene from "./MuseumScene";

export interface MuseumLabels {
  help: string;
  forward: string;
  back: string;
  left: string;
  right: string;
  close: string;
  previous: string;
  next: string;
  /** Mouse/keyboard hint for large screens; touch screens show `help` with the HUD. */
  hint?: string;
  /** Exhibit: the button under the ward logo close-up. */
  aboutWard?: string;
  /** The link from a photograph's close-up to its site's page. */
  readMore?: string;
}

/** intro: the slow walk before Start Exploring; explore: the visitor walks; backdrop: still and
 *  untouchable behind another page's content (the camera keeps its place). */
export type MuseumPhase = "intro" | "explore" | "backdrop";

/** Lets the gallery's accessible DOM frames ask the 3D view to approach a photograph. */
export interface MuseumApi {
  open: (index: number) => void;
}

interface MuseumCanvasProps {
  /** All photos for this build; `filter` picks the flat, shown subset. */
  photos: GalleryPhoto[];
  sites: { slug: string; name: string }[];
  filter: string;
  lang: Locale;
  /** False while something outside the museum (the 2D photo view) has the page. */
  enabled: boolean;
  reducedMotion: boolean;
  compact: boolean;
  activeIndex: number;
  labels: MuseumLabels;
  credit: string | null;
  /** Lives in the parent, so switching layouts never resets the camera. */
  poseRef: MutableRefObject<WorldPose>;
  /** Called once the WebGL renderer exists, so the parent can clear its loading state. */
  onReady?: () => void;
  /** Incremented when a DOM frame asks the camera to look at it. */
  focusNonce: number;
  /** Receives the handle the gallery's DOM frames use to open a close-up (null on unmount). */
  onApi?: (api: MuseumApi | null) => void;
  onActiveIndex: (index: number) => void;
  /** The photo being looked at closely, or null when the visitor steps back. */
  onFocusChange?: (index: number | null) => void;
  /** Context loss or a renderer error switches the parent to its fallback. */
  onFail: () => void;
  /** Home page: entrance hall with the ward map and logo, signboards, a wing per site. */
  exhibit?: ExhibitInput;
  /** Exhibit: "intro" drifts slowly forward and takes no input until Start Exploring. */
  phase?: MuseumPhase;
  /** Exhibit: where "About Ward 16 →" leads (the existing overview on the home page). */
  aboutHref?: string;
  /** "/en/heritage/": a photograph's close-up links to its site's page under this path. */
  heritageBase?: string;
}

type Focus = { kind: "art"; index: number } | { kind: "display"; key: "map" | "logo" };

interface Travel {
  seg: number;
  nonce: number;
}

interface MuseumNavActions {
  move: (action: "forward" | "backward") => void;
  turn: (direction: "left" | "right") => void;
}

interface MuseumGesture {
  /** Set once a pointer travels far enough that its release must not count as a click. */
  moved: boolean;
}

type MoveAction = "forward" | "backward" | "left" | "right" | "turnLeft" | "turnRight";

/** Thumbnails start nearest the visitor, then fill the rest of the hall in small idle batches. */
const LOAD_WINDOW = 6;
const COMPACT_LOAD_WINDOW = 4;
const BACKGROUND_BATCH = 4;
const COMPACT_BACKGROUND_BATCH = 2;
const BACKGROUND_DELAY_MS = 220;
const COMPACT_BACKGROUND_DELAY_MS = 420;
const FIRST_BATCH_DELAY_MS = 600;
/** Exhibit: frames of a wing that load at once when it opens (the ones nearest its doorway). */
const WING_FIRST = 4;

/** The slow walk before Start Exploring: how far, how long, and how often a frame is drawn. */
const INTRO_DISTANCE = 3.4;
const INTRO_SECONDS = 30;
const INTRO_FPS = 30;

function nearbyArtworkIndices(activeIndex: number, count: number, loadWindow = LOAD_WINDOW): number[] {
  if (count === 0 || activeIndex < 0) return [];
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

/** Codes keep W/A/S/D stable; arrows use `key` because their codes are layout-independent.
 *  ← → turn (so the keyboard alone can look down either wing); A/D step sideways. */
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
      return "turnLeft";
    case "ArrowRight":
      return "turnRight";
  }
  return null;
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']"));
}

/** Real controls keep their own keyboard behaviour; accessible artwork frames stay navigable. */
function isGuardedControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest(".photo-view, .view-pill, .filter-tabs, .list-row, .museum-hud, .museum-card, .museum-topbar, .museum-contact")) return true;
  return Boolean(target.closest("button, a, [role='button']")) && !target.closest(".wall-frame, .museum-a11y");
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function focusItemFor(world: MuseumWorld, focus: Focus): FocusItem | null {
  if (focus.kind === "art") {
    const placed = world.artworks.find((item) => item.art.index === focus.index);
    return placed ? artworkFocusItem(placed) : null;
  }
  const display = world.displays.find((item) => item.key === focus.key);
  return display ? displayFocusItem(display) : null;
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

interface Flight {
  t0: number;
  duration: number;
  from: ViewPose;
  to: ViewPose;
  /** Within one hall the flight follows the hall's own curve (path coordinates)… */
  local: { from: WorldPose; fromY: number } | null;
  /** …between halls it arcs over the junction. */
  via: { x: number; z: number } | null;
  end: { pose: WorldPose; y: number; hold: boolean };
  onDone?: () => void;
}

interface ControlsProps {
  world: MuseumWorld;
  /** Walking, looking and wheel/pinch input are live (explore phase, nothing held close). */
  movable: boolean;
  phase: MuseumPhase;
  reducedMotion: boolean;
  compact: boolean;
  activeIndex: number;
  poseRef: MutableRefObject<WorldPose>;
  focusNonce: number;
  focus: Focus | null;
  travel: Travel | null;
  reserve: { right: number; bottom: number };
  visible: boolean;
  gesture: MutableRefObject<MuseumGesture>;
  navRef: MutableRefObject<MuseumNavActions | null>;
  onActiveIndex: (index: number) => void;
  onZone: (seg: number, nearJunction: boolean) => void;
  onArrive: () => void;
  /** Scrolling over a close-up steps back (instead of scrolling the page away from the museum). */
  onStepBack: () => void;
}

/**
 * Mouse, wheel, touch and keyboard navigation, plus the timed camera flights (approaching a picture,
 * stepping back, walking into a wing) and the slow intro walk. All per-frame state is in refs: no
 * React render per drag frame. Frames are drawn on demand: only while something moves.
 */
function MuseumControls({
  world,
  movable,
  phase,
  reducedMotion,
  compact,
  activeIndex,
  poseRef,
  focusNonce,
  focus,
  travel,
  reserve,
  visible,
  gesture,
  navRef,
  onActiveIndex,
  onZone,
  onArrive,
  onStepBack,
}: ControlsProps) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);

  // Refs start from constants; the preserved pose is copied in the mount effect below (reading
  // poseRef.current during render would break React's render rules). No per-frame React state.
  const target = useRef<WorldPose>({ seg: 0, ...(compact ? COMPACT_INITIAL_POSE : INITIAL_POSE) });
  const eyeY = useRef<number>(MUSEUM.eyeHeight);
  const currentIndex = useRef(activeIndex);
  const pointers = useRef(new Map<number, { x: number; y: number; startX: number; startY: number }>());
  const pinch = useRef<number | null>(null);
  const handledNonce = useRef(focusNonce);
  const handledTravel = useRef(0);
  const pressed = useRef(new Set<MoveAction>());
  const initialised = useRef(false);
  const flight = useRef<Flight | null>(null);
  /** True while the camera rests in front of a picture after a close-up flight. */
  const holding = useRef(false);
  /** Where to step back to after a close look. */
  const returnTo = useRef<{ pose: WorldPose; y: number } | null>(null);
  const intro = useRef<{ t0: number; from: WorldPose } | null>(null);
  const previousPhase = useRef(phase);
  const zone = useRef<{ seg: number; near: boolean }>({ seg: -1, near: false });

  useEffect(() => {
    currentIndex.current = activeIndex;
  }, [activeIndex]);

  const apply = useCallback(
    (view: ViewPose) => {
      camera.position.set(view.x, view.y, view.z);
      camera.rotation.set(view.pitch, view.yaw, 0, "YXZ");
    },
    [camera],
  );

  // On first mount, resume the pose the parent kept while a layout switch unmounted us. On a later
  // world change, only clamp the goal when the new hall makes it invalid; damping then eases the
  // camera back instead of teleporting to the entrance.
  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      const kept = poseRef.current;
      // Only an untouched initial value is replaced on compact screens, so a fresh gallery visit
      // starts a little further back in the same hall.
      const untouched = kept.seg === 0 && kept.s === INITIAL_POSE.s && kept.lateral === 0 && kept.heading === 0 && kept.pitch === 0;
      const pose = clampWorldPose(world, compact && untouched ? { seg: 0, ...COMPACT_INITIAL_POSE } : kept);
      target.current = { ...pose };
      poseRef.current = { ...pose };
      apply(viewOf(world, pose));
      invalidate();
      return;
    }
    const clamped = clampWorldPose(world, target.current);
    if (clamped.seg !== target.current.seg || clamped.s !== target.current.s || clamped.lateral !== target.current.lateral) {
      target.current = clamped;
      poseRef.current = clampWorldPose(world, poseRef.current);
      invalidate();
    }
  }, [world, poseRef, apply, invalidate, compact]);

  const currentView = useCallback(
    (): ViewPose => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: camera.rotation.y, pitch: camera.rotation.x }),
    [camera],
  );

  /** Glide the camera to a pose. Distance and turn set the duration; reduced motion makes it a cut. */
  const fly = useCallback(
    (pose: WorldPose, y: number, hold: boolean, onDone?: () => void) => {
      const from = currentView();
      const to = viewOf(world, pose, y);
      const fromSeg = segmentAt(world, from.x, from.z, pose.seg);
      const same = fromSeg === pose.seg;
      const turn = Math.abs(normalizeHeading(to.yaw - from.yaw));
      const distance = Math.hypot(to.x - from.x, to.z - from.z) + Math.abs(to.y - from.y);
      flight.current = {
        t0: performance.now(),
        duration: reducedMotion ? 0 : Math.min(2.6, Math.max(0.9, 0.75 + distance * 0.07 + turn * 0.3)),
        from,
        to,
        local: same ? { from: poseAt(world, pose.seg, from.x, from.z, from.yaw, from.pitch), fromY: from.y } : null,
        via: same ? null : world.junction,
        end: { pose: { ...pose }, y, hold },
        onDone,
      };
      pressed.current.clear();
      invalidate();
    },
    [currentView, world, reducedMotion, invalidate],
  );

  const steer = useCallback(
    (pose: WorldPose) => {
      target.current = clampWorldPose(world, pose);
      invalidate();
    },
    [world, invalidate],
  );

  // A focused DOM frame asks the camera to look at its 3D counterpart. The nonce guard keeps a
  // filter/language re-render from steering on its own; only a fresh focus request does that.
  useEffect(() => {
    if (focusNonce === handledNonce.current) return;
    handledNonce.current = focusNonce;
    const placed = world.artworks.find((item) => item.art.index === activeIndex);
    if (placed) steer({ seg: placed.seg, ...artworkPose(world.segments[placed.seg].layout, placed.art) });
  }, [focusNonce, activeIndex, world, steer]);

  // Close-up: walk up to the picture; stepping back returns exactly to where the visitor stood.
  useEffect(() => {
    if (focus) {
      const item = focusItemFor(world, focus);
      if (!item) return;
      if (!returnTo.current) returnTo.current = { pose: { ...poseRef.current }, y: eyeY.current };
      const { pose, y } = focusPose(world, item, {
        width: size.width,
        height: size.height,
        // ResponsiveCamera (an earlier sibling) has already set this size's field of view.
        fov: (camera as THREE.PerspectiveCamera).fov,
        reserveRight: reserve.right,
        reserveBottom: reserve.bottom,
      });
      fly(pose, y, true, onArrive);
    } else if (returnTo.current) {
      const back = returnTo.current;
      returnTo.current = null;
      holding.current = false;
      fly(back.pose, back.y, false);
    }
  }, [focus, world, size.width, size.height, camera, reserve.right, reserve.bottom, fly, onArrive, poseRef]);

  // A signboard was chosen: walk through the junction and a few steps into that wing.
  useEffect(() => {
    if (!travel || travel.nonce === handledTravel.current) return;
    handledTravel.current = travel.nonce;
    returnTo.current = null;
    holding.current = false;
    fly(wingEntryPose(travel.seg), MUSEUM.eyeHeight, false);
  }, [travel, fly]);

  // Intro: remember where the slow walk starts. Leaving it settles the gaze level, ready to explore.
  useEffect(() => {
    if (phase === "intro") {
      intro.current = { t0: performance.now(), from: { ...poseRef.current } };
      invalidate();
    } else if (phase === "explore" && previousPhase.current === "intro") {
      intro.current = null;
      // Portrait phones see a lot of ceiling at eye level; a slight downward gaze shows the walls.
      target.current = { ...poseRef.current, lateral: 0, heading: 0, pitch: compact ? -0.12 : 0 };
      invalidate();
    }
    previousPhase.current = phase;
  }, [phase, poseRef, invalidate, compact]);

  // The intro is drawn at a modest frame rate and only while visible: it should feel alive, not
  // keep the GPU busy. Nothing is drawn while the page is hidden or the museum is scrolled away.
  useEffect(() => {
    if (phase !== "intro" || reducedMotion || !visible) return;
    const id = window.setInterval(() => {
      if (!document.hidden) invalidate();
    }, 1000 / INTRO_FPS);
    return () => window.clearInterval(id);
  }, [phase, reducedMotion, visible, invalidate]);

  // Movement is keyed independently of yaw: strafing never rotates the camera. Modify keys and
  // page controls are ignored, and every release/blur clears held keys so motion cannot stick.
  useEffect(() => {
    if (!movable) {
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
  }, [movable, invalidate]);

  /** Move one discrete step, clipped by the walls; through the junction it continues in the next hall.
   *  Shared by keys, pinch, wheel and the touch buttons. */
  const move = useCallback(
    (action: "forward" | "backward", step: number) => {
      target.current = moveInWorld(world, target.current, action === "forward" ? 1 : -1, 0, step);
      invalidate();
    },
    [world, invalidate],
  );

  const moveForward = useCallback((step: number) => move(step < 0 ? "backward" : "forward", Math.abs(step)), [move]);

  const turn = useCallback(
    (direction: "left" | "right") => {
      const delta = direction === "left" ? Math.PI / 8 : -Math.PI / 8;
      target.current = { ...target.current, heading: normalizeHeading(target.current.heading + delta) };
      invalidate();
    },
    [invalidate],
  );

  // The compact HUD calls into the same steering as dragging and the keyboard.
  useEffect(() => {
    navRef.current = movable ? { move: (action) => move(action, 1.45), turn } : null;
    return () => {
      navRef.current = null;
    };
  }, [movable, move, turn, navRef]);

  // While a picture is held close the camera takes no drags, but a fresh press must still count as a
  // click (on another picture, or on bare wall to step back).
  useEffect(() => {
    const element = gl.domElement;
    if (movable) return;
    const onPointerDown = () => {
      gesture.current.moved = false;
    };
    const onWheel = (event: WheelEvent) => {
      if (!focus) return;
      event.preventDefault();
      onStepBack();
    };
    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("wheel", onWheel);
    };
  }, [gl, movable, gesture, focus, onStepBack]);

  // Pointer: one finger/mouse button looks around; two fingers pinch to walk. Pointer capture keeps
  // a drag alive outside the canvas, and `touch-action: none` (CSS) stops the page scrolling under it.
  // The drag flag survives pointerup so the click that follows a drag cannot select anything.
  useEffect(() => {
    const element = gl.domElement;
    if (!movable) return;
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
  }, [gl, movable, invalidate, moveForward, gesture]);

  const report = useCallback(
    (pose: WorldPose, view: ViewPose) => {
      // A wing's floor reaches back across the junction; only past its doorway (s >= 0) is one "in" it.
      const inWing = pose.seg > 0 && pose.s >= 0;
      const seg = inWing ? pose.seg : 0;
      const near = !inWing && world.junctionFrom !== null && (pose.seg > 0 || pose.s > world.junctionFrom);
      if (zone.current.seg !== seg || zone.current.near !== near) {
        zone.current = { seg, near };
        onZone(seg, near);
      }
      let nearest = -1;
      // Larger frames are comfortably viewed from farther back; keep the active index in step.
      let best = 6.2;
      for (const placed of world.artworks) {
        const distance = Math.hypot(view.x - placed.world[0], view.z - placed.world[2]);
        if (distance < best) {
          best = distance;
          nearest = placed.art.index;
        }
      }
      if (nearest >= 0 && nearest !== currentIndex.current) {
        currentIndex.current = nearest;
        onActiveIndex(nearest);
      }
    },
    [world, onZone, onActiveIndex],
  );

  // With frameloop="demand", invalidate() here is what keeps a transition alive until it settles;
  // once still, the scene costs no frames.
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const now = performance.now();

    const trip = flight.current;
    if (trip) {
      const t = trip.duration <= 0 ? 1 : Math.min(1, (now - trip.t0) / (trip.duration * 1000));
      const e = easeInOut(t);
      let view: ViewPose;
      if (trip.local) {
        const a = trip.local.from;
        const b = trip.end.pose;
        const pose: WorldPose = {
          seg: b.seg,
          s: lerp(a.s, b.s, e),
          lateral: lerp(a.lateral, b.lateral, e),
          heading: a.heading + normalizeHeading(b.heading - a.heading) * e,
          pitch: lerp(a.pitch, b.pitch, e),
        };
        view = viewOf(world, pose, lerp(trip.local.fromY, trip.end.y, e));
        poseRef.current = pose;
      } else {
        const { from, to, via } = trip;
        const c = via ?? { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 };
        const u = 1 - e;
        view = {
          x: u * u * from.x + 2 * u * e * c.x + e * e * to.x,
          z: u * u * from.z + 2 * u * e * c.z + e * e * to.z,
          y: lerp(from.y, to.y, e),
          yaw: from.yaw + normalizeHeading(to.yaw - from.yaw) * e,
          pitch: lerp(from.pitch, to.pitch, e),
        };
      }
      apply(view);
      eyeY.current = view.y;
      if (t >= 1) {
        flight.current = null;
        poseRef.current = { ...trip.end.pose };
        target.current = { ...trip.end.pose };
        eyeY.current = trip.end.y;
        holding.current = trip.end.hold;
        report(trip.end.pose, trip.to);
        trip.onDone?.();
      } else {
        invalidate();
      }
      return;
    }

    if (holding.current) return;

    const run = intro.current;
    if (phase === "intro" && run) {
      // A slow, eased walk forward with a gentle sway of the gaze, as if strolling in.
      const seconds = (now - run.t0) / 1000;
      const travelled = reducedMotion ? 0 : INTRO_DISTANCE * easeInOut(Math.min(1, seconds / INTRO_SECONDS));
      const sway = reducedMotion ? 0 : 1;
      const pose: WorldPose = {
        ...run.from,
        s: run.from.s + travelled,
        lateral: run.from.lateral + 0.12 * sway * Math.sin((seconds * Math.PI * 2) / 23),
        heading: 0.045 * sway * Math.sin((seconds * Math.PI * 2) / 16),
        pitch: (compact ? -0.1 : -0.012) + 0.01 * sway * Math.sin((seconds * Math.PI * 2) / 11),
      };
      poseRef.current = pose;
      target.current = { ...pose };
      apply(viewOf(world, pose, eyeY.current));
      return;
    }

    if (movable && pressed.current.size > 0) {
      let forward = 0;
      let strafe = 0;
      let turning = 0;
      if (pressed.current.has("forward")) forward += 1;
      if (pressed.current.has("backward")) forward -= 1;
      if (pressed.current.has("right")) strafe += 1;
      if (pressed.current.has("left")) strafe -= 1;
      if (pressed.current.has("turnLeft")) turning += 1;
      if (pressed.current.has("turnRight")) turning -= 1;
      if (turning !== 0) target.current = { ...target.current, heading: normalizeHeading(target.current.heading + turning * 1.5 * dt) };
      if (forward !== 0 || strafe !== 0) {
        const length = Math.hypot(forward, strafe);
        target.current = moveInWorld(world, target.current, forward / length, strafe / length, 2.7 * dt);
      }
    }

    const goal = target.current;
    const previous = convertPose(world, poseRef.current, goal.seg);
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 7);
    const dheading = normalizeHeading(goal.heading - previous.heading);
    const pose: WorldPose = {
      seg: goal.seg,
      s: previous.s + (goal.s - previous.s) * k,
      lateral: previous.lateral + (goal.lateral - previous.lateral) * k,
      heading: previous.heading + dheading * k,
      pitch: previous.pitch + (goal.pitch - previous.pitch) * k,
    };
    poseRef.current = pose;
    eyeY.current += (MUSEUM.eyeHeight - eyeY.current) * k;

    const view = viewOf(world, pose, eyeY.current);
    apply(view);

    const moving =
      pressed.current.size > 0 ||
      Math.abs(goal.s - pose.s) +
        Math.abs(goal.lateral - pose.lateral) +
        Math.abs(dheading) +
        Math.abs(goal.pitch - pose.pitch) +
        Math.abs(MUSEUM.eyeHeight - eyeY.current) >
        0.002;
    if (moving) invalidate();
    report(pose, view);
  });

  return null;
}

/**
 * Client-only entry for the 3D museum. On the gallery page the DOM walk (Gallery.tsx) stays in the
 * page as the accessibility tree and the no-WebGL fallback; on the home page this component renders
 * its own accessible buttons. Rendered with `dynamic(..., { ssr: false })`, so nothing here is prerendered.
 */
export default function MuseumCanvas(props: MuseumCanvasProps) {
  const { photos, filter, lang, activeIndex, compact, onFail, exhibit, labels, credit, onActiveIndex, onFocusChange } = props;
  const phase: MuseumPhase = props.phase ?? "explore";
  const helpId = useId();
  const shown = useMemo(() => (filter === "all" ? photos : photos.filter((photo) => photo.site === filter)), [photos, filter]);
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
  const world = useMemo(
    () => (exhibit ? buildExhibitWorld(rooms, shown, lang, compact, exhibit) : buildHallWorld(rooms, shown, lang, compact)),
    [rooms, shown, lang, compact, exhibit],
  );
  const siteName = useMemo(() => new Map(props.sites.map((site) => [site.slug, site.name])), [props.sites]);
  const loadWindow = compact ? COMPACT_LOAD_WINDOW : LOAD_WINDOW;
  const backgroundBatch = compact ? COMPACT_BACKGROUND_BATCH : BACKGROUND_BATCH;
  const backgroundDelay = compact ? COMPACT_BACKGROUND_DELAY_MS : BACKGROUND_DELAY_MS;
  const count = shown.length;

  // Exhibit: a wing's photographs load only once the visitor heads for it (nearing the junction,
  // choosing its sign, or walking in), so the landing page itself downloads just the map and logo.
  const [openWings, setOpenWings] = useState<ReadonlySet<number>>(() => new Set());
  const allowed = useCallback(
    (index: number) => {
      if (!exhibit) return true;
      const placed = world.artworks.find((item) => item.art.index === index);
      return placed !== undefined && openWings.has(placed.seg);
    },
    [exhibit, world, openWings],
  );
  const openWing = useCallback((seg: number) => {
    setOpenWings((previous) => (previous.has(seg) ? previous : new Set([...previous, seg])));
  }, []);

  // Loading priority is a growing set, not a moving window: once a frame has been asked to load it
  // keeps its texture for as long as it is mounted. A new exhibition (filter/language/photo set)
  // starts a fresh set; navigation only adds nearby frames, so distant frames never go blank.
  const exhibitionKey = useMemo(() => shown.map((photo) => photo.thumb.src).join("\u0000"), [shown]);
  const [backgroundIndices, setBackgroundIndices] = useState(() => ({
    key: exhibitionKey,
    indices: new Set(exhibit ? [] : nearbyArtworkIndices(activeIndex, count, loadWindow)),
  }));
  const loadingIndices = useMemo(() => {
    const next = new Set(backgroundIndices.key === exhibitionKey ? backgroundIndices.indices : []);
    // Derived during render so walking adds the newly nearby frames without a cascading render.
    for (const index of nearbyArtworkIndices(activeIndex, count, loadWindow)) if (allowed(index)) next.add(index);
    for (const seg of openWings) {
      world.artworks
        .filter((item) => item.seg === seg)
        .slice(0, WING_FIRST)
        .forEach((item) => next.add(item.art.index));
    }
    return next;
  }, [backgroundIndices, exhibitionKey, activeIndex, count, loadWindow, allowed, openWings, world]);

  // After the first nearby group has had time to decode, fill the remaining frames a few at a time.
  useEffect(() => {
    const pending: number[] = [];
    for (let index = 0; index < count; index += 1) {
      if (!loadingIndices.has(index) && allowed(index)) pending.push(index);
    }
    if (pending.length === 0) return;
    const isFirstBatch = loadingIndices.size <= loadWindow * 2 + 1;
    const from = Math.max(0, activeIndex);
    pending.sort((a, b) => Math.abs(a - from) - Math.abs(b - from) || a - b);
    const batch = pending.slice(0, backgroundBatch);
    const timer = window.setTimeout(() => {
      setBackgroundIndices((previous) => {
        const next = new Set(previous.key === exhibitionKey ? previous.indices : loadingIndices);
        batch.forEach((index) => next.add(index));
        return { key: exhibitionKey, indices: next };
      });
    }, isFirstBatch ? FIRST_BATCH_DELAY_MS : backgroundDelay);
    return () => window.clearTimeout(timer);
  }, [loadingIndices, count, allowed, exhibitionKey, activeIndex, backgroundBatch, backgroundDelay, loadWindow]);

  const gesture = useRef<MuseumGesture>({ moved: false });
  const navRef = useRef<MuseumNavActions | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [arrived, setArrived] = useState(false);
  const [travel, setTravel] = useState<Travel | null>(null);
  const [zoneSeg, setZoneSeg] = useState(0);
  // Leaving the museum for another page puts any close-up away (state adjusted during render, React's
  // pattern for resetting state when a prop changes), so it is not still open on the way back.
  const [seenPhase, setSeenPhase] = useState(phase);
  if (seenPhase !== phase) {
    setSeenPhase(phase);
    if (phase !== "explore") {
      setFocus(null);
      setArrived(false);
      setHoverKey(null);
    }
  }
  const router = useRouter();
  const opener = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const failed = useRef(false);
  const fail = useCallback(() => {
    if (failed.current) return;
    failed.current = true;
    onFail();
  }, [onFail]);

  // The card's place (beside the picture on wide screens, a sheet below it otherwise) decides where
  // the camera frames the picture, so both come from the museum's own measured size.
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const resize = new ResizeObserver(([entry]) => {
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    const seen = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    resize.observe(element);
    seen.observe(element);
    return () => {
      resize.disconnect();
      seen.disconnect();
    };
  }, []);
  const cardSide = box.width >= 900 && box.width / Math.max(1, box.height) >= 1.1;
  const reserve = useMemo(
    () => ({ right: cardSide ? Math.min(416, box.width * 0.4) + 48 : 0, bottom: cardSide ? 0 : box.height * 0.52 }),
    [cardSide, box.width, box.height],
  );

  const explore = phase === "explore";
  const interactive = props.enabled && explore;
  const movable = interactive && focus === null;

  const openFocus = useCallback(
    (next: Focus, from: HTMLElement | null = null) => {
      opener.current = from;
      setFocus(next);
      setArrived(false);
      setHoverKey(null);
      if (next.kind === "art") onActiveIndex(next.index);
      onFocusChange?.(next.kind === "art" ? next.index : null);
    },
    [onActiveIndex, onFocusChange],
  );

  const closeFocus = useCallback(() => {
    setFocus(null);
    setArrived(false);
    onFocusChange?.(null);
    const back = opener.current;
    opener.current = null;
    if (back?.isConnected) back.focus({ preventScroll: true });
  }, [onFocusChange]);

  const goTo = useCallback(
    (seg: number) => {
      setFocus(null);
      setArrived(false);
      setHoverKey(null);
      openWing(seg);
      setTravel((previous) => ({ seg, nonce: (previous?.nonce ?? 0) + 1 }));
    },
    [openWing],
  );

  const select = useCallback(
    (key: string) => {
      if (key.startsWith("art-")) openFocus({ kind: "art", index: Number(key.slice(4)) });
      else if (key === "map" || key === "logo") openFocus({ kind: "display", key });
      else if (key.startsWith("sign-")) {
        const sign = world.signs.find((item) => `sign-${item.key}` === key);
        if (sign) goTo(sign.target);
      } else if (key.startsWith("link-")) {
        // A "Read About →" plaque: an in-app navigation, so Back returns to the museum.
        const link = world.links.find((item) => `link-${item.key}` === key);
        if (link) router.push(link.href);
      }
    },
    [openFocus, goTo, world, router],
  );

  const onZone = useCallback(
    (seg: number, near: boolean) => {
      setZoneSeg(seg);
      if (seg > 0) openWing(seg);
      if (near) {
        world.segments.forEach((_, index) => {
          if (index > 0) openWing(index);
        });
      }
    },
    [openWing, world],
  );
  const onArrive = useCallback(() => setArrived(true), []);

  const { onApi } = props;
  useEffect(() => {
    if (!onApi) return;
    onApi({ open: (index: number) => openFocus({ kind: "art", index }, document.activeElement as HTMLElement | null) });
    return () => onApi(null);
  }, [onApi, openFocus]);

  const focusedArt = focus?.kind === "art" ? world.artworks.find((item) => item.art.index === focus.index) : undefined;
  const focusedDisplay = focus?.kind === "display" ? world.displays.find((item) => item.key === focus.key) : undefined;
  const siblings = useMemo(() => (focusedArt ? world.artworks.filter((item) => item.seg === focusedArt.seg) : []), [focusedArt, world]);
  const position = focusedArt ? siblings.indexOf(focusedArt) : -1;
  const step = useCallback(
    (delta: number) => {
      const next = siblings[position + delta];
      if (next) openFocus({ kind: "art", index: next.art.index }, opener.current);
    },
    [siblings, position, openFocus],
  );

  // While looking closely: Esc or ↓ steps back, ← → move to the neighbouring photographs.
  useEffect(() => {
    if (!focus) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) return;
      if (event.key === "Escape" || event.key === "ArrowDown") {
        event.preventDefault();
        closeFocus();
      } else if (event.key === "ArrowLeft" && focusedArt) {
        event.preventDefault();
        step(-1);
      } else if (event.key === "ArrowRight" && focusedArt) {
        event.preventDefault();
        step(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, focusedArt, step, closeFocus]);

  // Once the camera has arrived, the details are revealed and take the keyboard focus.
  useEffect(() => {
    if (arrived) closeRef.current?.focus({ preventScroll: true });
  }, [arrived]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = interactive && hoverKey ? "pointer" : "";
  }, [hoverKey, interactive]);

  useEffect(
    () => () => {
      if (canvasRef.current) canvasRef.current.style.cursor = "";
      canvasRef.current?.removeEventListener("webglcontextlost", fail);
    },
    [fail],
  );

  const startPose = exhibit ? EXHIBIT_START_POSE : { seg: 0, ...(compact ? COMPACT_INITIAL_POSE : INITIAL_POSE) };
  const startView = viewOf(world, clampWorldPose(world, startPose));
  const wing = exhibit && zoneSeg > 0 ? world.signs.find((sign) => sign.target === zoneSeg) : undefined;
  const wingArtworks = exhibit && zoneSeg > 0 ? world.artworks.filter((item) => item.seg === zoneSeg) : [];
  const focusKey = focusedArt ? focusedArt.art.key : focusedDisplay ? focusedDisplay.key : null;

  return (
    <div
      ref={rootRef}
      className="museum-canvas gallery-museum"
      data-phase={phase}
      data-focus={focus ? (arrived ? "arrived" : "flying") : undefined}
    >
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
          // The camera starts at the open entrance and looks along the centreline. The
          // compact pose sits a little further back; ResponsiveCamera widens the field of view.
          camera={{
            position: [startView.x, startView.y, startView.z],
            rotation: [0, startView.yaw, 0],
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
          onPointerMissed={() => {
            // A click on bare wall or floor while looking closely steps back.
            if (focus && !gesture.current.moved) closeFocus();
          }}
        >
          <color attach="background" args={["#f3ede2"]} />
          <ResponsiveCamera compact={compact} />
          <MuseumControls
            world={world}
            movable={movable}
            phase={phase}
            reducedMotion={props.reducedMotion}
            compact={compact}
            activeIndex={activeIndex}
            poseRef={props.poseRef}
            focusNonce={props.focusNonce}
            focus={focus}
            travel={travel}
            reserve={reserve}
            visible={visible}
            gesture={gesture}
            navRef={navRef}
            onActiveIndex={onActiveIndex}
            onZone={onZone}
            onArrive={onArrive}
            onStepBack={closeFocus}
          />
          <MuseumScene
            world={world}
            loadingIndices={loadingIndices}
            activeIndex={activeIndex}
            focusKey={focusKey}
            hoverKey={interactive ? hoverKey : null}
            interactive={interactive}
            compact={compact}
            reducedMotion={props.reducedMotion}
            gesture={gesture}
            onHover={setHoverKey}
            onSelect={select}
          />
        </Canvas>
      </div>

      {/* Home page: real buttons for everything the 3D view can do, shown when they take keyboard focus. */}
      {exhibit && explore && (
        <div className="museum-a11y">
          {world.displays.map((display) => (
            <button key={display.key} type="button" onClick={(event) => openFocus({ kind: "display", key: display.key }, event.currentTarget)}>
              {display.alt}
            </button>
          ))}
          {world.signs.map((sign) => (
            <button key={sign.key} type="button" onClick={() => goTo(sign.target)}>
              {sign.label}
            </button>
          ))}
          {world.links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              prefetch={false}
              onFocus={() => setHoverKey(`link-${link.key}`)}
              onBlur={() => setHoverKey(null)}
            >
              {link.label}
            </Link>
          ))}
          {wingArtworks.map((placed) => (
            <button key={placed.art.key} type="button" onClick={(event) => openFocus({ kind: "art", index: placed.art.index }, event.currentTarget)}>
              {placed.art.caption}
            </button>
          ))}
        </div>
      )}

      {explore && !focus && (wing || (!compact && labels.hint)) && (
        <div className="museum-caption" aria-hidden={wing ? undefined : true}>
          {wing && <p className="museum-place">{wing.label}</p>}
          {!compact && labels.hint && <p className="museum-hint">{labels.hint}</p>}
        </div>
      )}

      {focus && arrived && (focusedArt || focusedDisplay) && (
        <div className={`museum-card ${cardSide ? "museum-card-side" : "museum-card-sheet"}`} role="group" aria-label={focusedArt?.art.caption ?? focusedDisplay?.alt}>
          <button ref={closeRef} type="button" className="mono link-slide" onClick={closeFocus}>
            <span aria-hidden="true">←&nbsp;</span>
            {labels.close}
          </button>
          {focusedArt && <p className="mono muted mt-4">{siteName.get(focusedArt.art.photo.site)}</p>}
          <p className="museum-card-caption mt-2">{focusedArt ? focusedArt.art.caption : focusedDisplay?.alt}</p>
          {focusedArt && credit && <p className="mono muted mt-3">{credit}</p>}
          {focusedArt && (siblings.length > 1 || (props.heritageBase && labels.readMore)) && (
            // Phones: arrow-only buttons (named for screen readers) share one row with "Read more".
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {siblings.length > 1 && (
                <>
                  <button
                    type="button"
                    className={`btn btn-outline${cardSide ? "" : " museum-card-step"}`}
                    disabled={position <= 0}
                    aria-label={cardSide ? undefined : labels.previous}
                    title={cardSide ? undefined : labels.previous}
                    onClick={() => step(-1)}
                  >
                    <span aria-hidden="true">←</span>
                    {cardSide && ` ${labels.previous}`}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline${cardSide ? "" : " museum-card-step"}`}
                    disabled={position >= siblings.length - 1}
                    aria-label={cardSide ? undefined : labels.next}
                    title={cardSide ? undefined : labels.next}
                    onClick={() => step(1)}
                  >
                    {cardSide && `${labels.next} `}
                    <span aria-hidden="true">→</span>
                  </button>
                </>
              )}
              {props.heritageBase && labels.readMore && (
                <div className={cardSide ? "mt-3 w-full" : undefined}>
                  <a href={`${props.heritageBase}${focusedArt.art.photo.site}/`} className="museum-card-about">
                    {labels.readMore} <span aria-hidden="true">→</span>
                  </a>
                </div>
              )}
            </div>
          )}
          {focusedDisplay?.key === "logo" && props.aboutHref && labels.aboutWard && (
            <a href={props.aboutHref} className="museum-card-about mt-5">
              {labels.aboutWard}
            </a>
          )}
        </div>
      )}

      {compact && explore && !focus && (
        <div className="museum-hud">
          <p className="museum-help" id={helpId}>
            {labels.help}
          </p>
          <div className="museum-nav" role="group" aria-describedby={helpId}>
            <button type="button" className="museum-nav-button museum-nav-left" aria-label={labels.left} disabled={!movable} onClick={() => navRef.current?.turn("left")}>
              <span aria-hidden="true">↶</span>
            </button>
            <button type="button" className="museum-nav-button museum-nav-forward" aria-label={labels.forward} disabled={!movable} onClick={() => navRef.current?.move("forward")}>
              <span aria-hidden="true">↑</span>
            </button>
            <button type="button" className="museum-nav-button museum-nav-back" aria-label={labels.back} disabled={!movable} onClick={() => navRef.current?.move("backward")}>
              <span aria-hidden="true">↓</span>
            </button>
            <button type="button" className="museum-nav-button museum-nav-right" aria-label={labels.right} disabled={!movable} onClick={() => navRef.current?.turn("right")}>
              <span aria-hidden="true">↷</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
