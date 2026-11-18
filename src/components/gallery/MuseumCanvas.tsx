"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

import { formatNumber } from "@/lib/format";
import type { GalleryPhoto } from "@/lib/images";
import {
  INITIAL_POSE,
  MUSEUM,
  artworkPose,
  buildMuseumLayout,
  clipMuseumPosition,
  firstIndexInHall,
  hallEntryPose,
  hallOfArtwork,
  orderedArtworks,
  type CameraPose,
  type MuseumHall,
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
  activeIndex: number;
  /** Lives in Gallery, so opening PhotoView or switching layouts never resets the camera. */
  poseRef: MutableRefObject<CameraPose>;
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
  halls: MuseumHall[];
  gesture: MutableRefObject<MuseumGesture>;
}

interface MuseumGesture {
  /** Set once a pointer travels far enough that its release must not count as a frame click. */
  moved: boolean;
}

function twoDigits(n: number, lang: Locale): string {
  const text = formatNumber(n, lang);
  return text.length < 2 ? `${lang === "ne" ? "०" : "0"}${text}` : text;
}

/** Mouse, wheel, touch and keyboard navigation. All state is in refs: no React render per drag frame. */
function MuseumControls({
  halls,
  enabled,
  reducedMotion,
  activeIndex,
  poseRef,
  focusNonce,
  onActiveIndex,
  onFocusArtwork,
  filter,
  gesture,
}: ControlsProps) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);

  const artworks = useMemo(() => orderedArtworks(halls), [halls]);
  // Refs start from constants; the preserved pose is copied in the mount effect below (reading
  // poseRef.current during render would break React's render rules). No per-frame React state.
  const target = useRef<CameraPose>({ ...INITIAL_POSE });
  const currentIndex = useRef(activeIndex);
  const pointers = useRef(new Map<number, { x: number; y: number; startX: number; startY: number }>());
  const pinch = useRef<number | null>(null);
  const handledNonce = useRef(focusNonce);
  const handledFilter = useRef(filter);

  useEffect(() => {
    currentIndex.current = activeIndex;
  }, [activeIndex]);

  // On (re)mount, resume the pose Gallery kept while PhotoView or a layout switch unmounted us.
  // The canvas starts at INITIAL_POSE for SSR-safe rendering; this effect puts it back on the view.
  useEffect(() => {
    const pose = poseRef.current;
    target.current = { ...pose };
    camera.position.set(pose.x, MUSEUM.eyeHeight, pose.z);
    camera.rotation.set(pose.pitch, pose.yaw, 0, "YXZ");
    invalidate();
  }, [poseRef, camera, invalidate]);

  const steer = useCallback(
    (pose: CameraPose) => {
      target.current = { ...pose };
      invalidate();
    },
    [invalidate],
  );

  const steerToArtwork = useCallback(
    (index: number) => {
      const art = artworks.find((item) => item.index === index);
      if (art) steer(artworkPose(art));
    },
    [artworks, steer],
  );

  // A focused DOM frame asks the camera to look at its 3D counterpart. The nonce guard keeps a
  // hall/language re-render from steering on its own; only a fresh focus request does that.
  useEffect(() => {
    if (focusNonce === handledNonce.current) return;
    handledNonce.current = focusNonce;
    steerToArtwork(activeIndex);
  }, [focusNonce, activeIndex, steerToArtwork]);

  // A site filter moves to that hall's entrance. "All" keeps the current view when appropriate.
  useEffect(() => {
    if (filter === handledFilter.current) return;
    handledFilter.current = filter;
    if (filter === "all" || !halls[0]) return;
    steer(hallEntryPose(halls[0]));
    const first = firstIndexInHall(halls[0]);
    if (first !== null) {
      currentIndex.current = first;
      onActiveIndex(first);
    }
  }, [filter, halls, steer, onActiveIndex]);

  /** Move along the camera's ground-forward vector, clipped by the hall/doorway footprint. */
  const moveForward = useCallback(
    (step: number) => {
      const { yaw } = target.current;
      const [x, z] = clipMuseumPosition(
        halls,
        [poseRef.current.x, poseRef.current.z],
        [target.current.x - Math.sin(yaw) * step, target.current.z - Math.cos(yaw) * step],
      );
      target.current.x = x;
      target.current.z = z;
      invalidate();
    },
    [halls, poseRef, invalidate],
  );

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
      target.current.yaw -= (event.clientX - previous.x) * 0.0032;
      target.current.pitch = Math.max(-1.05, Math.min(1.05, target.current.pitch - (event.clientY - previous.y) * 0.0026));
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

  // Arrow keys walk the same order as the DOM frames; Up/Down move to the neighbouring hall.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const next = currentIndex.current + (event.key === "ArrowRight" ? 1 : -1);
        if (next < 0 || next >= artworks.length) return;
        currentIndex.current = next;
        onActiveIndex(next);
        steerToArtwork(next);
        onFocusArtwork(next);
        return;
      }
      const here = halls.findIndex((hall) => hall.slug === hallOfArtwork(halls, currentIndex.current)?.slug);
      const next = here + (event.key === "ArrowDown" ? 1 : -1);
      if (here < 0 || next < 0 || next >= halls.length) return;
      steer(hallEntryPose(halls[next]));
      const first = firstIndexInHall(halls[next]);
      if (first !== null) {
        currentIndex.current = first;
        onActiveIndex(first);
        onFocusArtwork(first);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, artworks, halls, onActiveIndex, onFocusArtwork, steer, steerToArtwork]);

  // Damping and spotlight both run inside useFrame. With frameloop="demand", invalidate() here is
  // what keeps the transition alive until it settles; once still, the scene costs no frames.
  useFrame((_, delta) => {
    const pose = poseRef.current;
    const goal = target.current;
    const k = reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 7);
    let dyaw = goal.yaw - pose.yaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    pose.x += (goal.x - pose.x) * k;
    pose.z += (goal.z - pose.z) * k;
    pose.yaw += dyaw * k;
    pose.pitch += (goal.pitch - pose.pitch) * k;
    camera.position.set(pose.x, MUSEUM.eyeHeight, pose.z);
    camera.rotation.set(pose.pitch, pose.yaw, 0, "YXZ");

    const moving =
      Math.abs(goal.x - pose.x) + Math.abs(goal.z - pose.z) + Math.abs(dyaw) + Math.abs(goal.pitch - pose.pitch) > 0.002;
    if (moving) invalidate();

    let nearest = -1;
    let best = 3.6;
    for (const art of artworks) {
      const distance = Math.hypot(pose.x - art.position[0], pose.z - art.position[2]);
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
  const { photos, sites, filter, lang, activeIndex, onFail } = props;
  const shown = useMemo(
    () => (filter === "all" ? photos : photos.filter((photo) => photo.site === filter)),
    [photos, filter],
  );
  const rooms = useMemo<MuseumRoomInput[]>(
    () =>
      sites.map((site, index) => ({
        slug: site.slug,
        name: site.name,
        number: twoDigits(index + 1, lang),
        visible: filter === "all" || filter === site.slug,
      })),
    [sites, filter, lang],
  );
  const halls = useMemo(() => buildMuseumLayout(rooms, shown, lang), [rooms, shown, lang]);

  // Progressive loading: the nearest hall is lit immediately, later halls one per idle period.
  // Camera navigation does not create textures early; it only changes which hall is looked at.
  const [activeHalls, setActiveHalls] = useState(1);
  useEffect(() => {
    if (activeHalls >= halls.length) return;
    let id = 0;
    const advance = () => setActiveHalls((count) => Math.min(count + 1, halls.length));
    if (typeof window.requestIdleCallback === "function") id = window.requestIdleCallback(advance);
    else id = window.setTimeout(advance, 250);
    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [activeHalls, halls.length]);

  const gesture = useRef<MuseumGesture>({ moved: false });
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

  return (
    <div className="museum-canvas gallery-museum" aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        // R3F auto-lookAt(0,0,0) unless a rotation is supplied; [0,0,0] looks straight down the hall (-Z).
        camera={{
          position: [INITIAL_POSE.x, MUSEUM.eyeHeight, INITIAL_POSE.z],
          rotation: [0, 0, 0],
          fov: 64,
          near: 0.1,
          far: 220,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          canvasRef.current = gl.domElement;
          gl.domElement.addEventListener("webglcontextlost", fail, { once: true });
        }}
      >
        <MuseumControls {...props} halls={halls} gesture={gesture} />
        <MuseumScene
          halls={halls}
          activeHalls={activeHalls}
          lang={lang}
          activeIndex={activeIndex}
          hoverIndex={props.enabled ? hoverIndex : null}
          interactive={props.enabled}
          gesture={gesture}
          objectsRef={objectsRef}
          onHover={setHoverIndex}
          onSelect={props.onOpenArtwork}
        />
        <ProjectionBridge objectsRef={objectsRef} projectionRef={props.projectionRef} />
      </Canvas>
    </div>
  );
}
