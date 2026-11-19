"use client";

import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, type MutableRefObject } from "react";
import * as THREE from "three";

import {
  MUSEUM,
  pathFrame,
  pathPoint,
  pathYaw,
  type MuseumArtwork,
  type MuseumLayout,
  type MuseumMarker,
  type Vec3,
} from "@/lib/museum-layout";
import { useMuseumDescriptionTexture, useMuseumImageTexture, useMuseumTextTexture } from "./useMuseumTextures";

/** Gallery-scoped neutral palette (mirrors the CSS tokens in globals.css). No site-specific detail. */
const STONE = "#f0e9dd";
const SANDSTONE = "#f4eee3";
const IVORY = "#f7f3ea";
const PANEL = "#e9dfce";
const CONCRETE = "#bdb5a8";
const CHARCOAL = "#272522";

interface SceneProps {
  layout: MuseumLayout;
  /** Growing set of frames whose thumbnails have been requested; loaded ones never go blank. */
  loadingIndices: ReadonlySet<number>;
  activeIndex: number;
  hoverIndex: number | null;
  interactive: boolean;
  compact: boolean;
  gesture: MutableRefObject<{ moved: boolean }>;
  objectsRef: MutableRefObject<Map<number, THREE.Object3D>>;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
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

function addQuad(data: GeometryData, corners: readonly Vec3[], normals: readonly Vec3[]): void {
  const base = data.positions.length / 3;
  corners.forEach((corner, index) => {
    data.positions.push(corner[0], corner[1], corner[2]);
    const normal = normals[index];
    data.normals.push(normal[0], normal[1], normal[2]);
    data.uvs.push(QUAD_UVS[index][0], QUAD_UVS[index][1]);
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

/** A ruled ribbon at constant height. The two lateral edges are parallel curves on the same path. */
function buildHorizontal(layout: MuseumLayout, y: number, normalY: 1 | -1): THREE.BufferGeometry {
  const data = emptyGeometryData();
  const half = layout.innerHalfWidth;
  const normal: Vec3 = [0, normalY, 0];
  const samples = layout.sampleS;
  for (let index = 0; index < samples.length - 1; index += 1) {
    const s0 = samples[index];
    const s1 = samples[index + 1];
    const nearLeft = pathPoint(layout, s0, -half, y);
    const nearRight = pathPoint(layout, s0, half, y);
    const farRight = pathPoint(layout, s1, half, y);
    const farLeft = pathPoint(layout, s1, -half, y);
    // Floor winds near-left → near-right → far-right; ceiling is reversed so its normal points down.
    if (normalY === 1) addQuad(data, [nearLeft, nearRight, farRight, farLeft], [normal, normal, normal, normal]);
    else addQuad(data, [nearLeft, farLeft, farRight, nearRight], [normal, normal, normal, normal]);
  }
  return makeGeometry(data);
}

/** A vertical ribbon on one side of the path. Normals follow the curve and point into the hall. */
function buildWall(layout: MuseumLayout, side: -1 | 1): THREE.BufferGeometry {
  const data = emptyGeometryData();
  const lateral = side * layout.innerHalfWidth;
  const samples = layout.sampleS;
  for (let index = 0; index < samples.length - 1; index += 1) {
    const s0 = samples[index];
    const s1 = samples[index + 1];
    const frame0 = pathFrame(layout, s0);
    const frame1 = pathFrame(layout, s1);
    const inward0: Vec3 =
      side === -1 ? [frame0.rightX, 0, frame0.rightZ] : [-frame0.rightX, 0, -frame0.rightZ];
    const inward1: Vec3 =
      side === -1 ? [frame1.rightX, 0, frame1.rightZ] : [-frame1.rightX, 0, -frame1.rightZ];
    const nearBottom = pathPoint(layout, s0, lateral, 0);
    const nearTop = pathPoint(layout, s0, lateral, MUSEUM.corridorHeight);
    const farTop = pathPoint(layout, s1, lateral, MUSEUM.corridorHeight);
    const farBottom = pathPoint(layout, s1, lateral, 0);
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
 */
function CurvedShell({ layout }: { layout: MuseumLayout }) {
  const geometry = useMemo(
    () => ({
      floor: buildHorizontal(layout, 0, 1),
      ceiling: buildHorizontal(layout, MUSEUM.corridorHeight, -1),
      left: buildWall(layout, -1),
      right: buildWall(layout, 1),
      end: buildEndCap(layout),
    }),
    [layout],
  );

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
      <group position={panelPosition} rotation={[0, pathYaw(layout, layout.path.end), 0]}>
        <mesh>
          <boxGeometry args={[layout.corridorWidth * 0.42, MUSEUM.corridorHeight * 0.58, MUSEUM.plaqueDepth]} />
          <meshStandardMaterial color={PANEL} roughness={0.94} metalness={0} />
        </mesh>
      </group>
    </>
  );
}

/** The photo's own description on a small panel fixed to the wall below its frame. It shares the
 *  artwork's rotation, so it faces the visitor without ever turning to follow the camera. */
function DescriptionPanel({ art, active }: { art: MuseumArtwork; active: boolean }) {
  const { width, height, offsetY } = art.description;
  const texture = useMuseumDescriptionTexture(art.caption, width, height, active);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (texture) invalidate();
  }, [texture, invalidate]);

  const depth = MUSEUM.descriptionDepth;
  // Sit just inside the frame's front plane so the label reads as part of the same wall unit.
  const panelZ = MUSEUM.frameDepth / 2 - depth / 2 + 0.002;

  return (
    <group position={[0, offsetY, panelZ]}>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#3a2a17" roughness={0.82} metalness={0} />
      </mesh>
      {texture && (
        <mesh position={[0, 0, depth / 2 + 0.001]}>
          <planeGeometry args={[width - 0.03, height - 0.03]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** A photo under cream mat and dark frame, kept to the photograph's own aspect ratio. */
function FramedArtwork({
  art,
  active,
  focused,
  hovered,
  interactive,
  gesture,
  objectsRef,
  onHover,
  onSelect,
}: {
  art: MuseumArtwork;
  active: boolean;
  focused: boolean;
  hovered: boolean;
  interactive: boolean;
  gesture: MutableRefObject<{ moved: boolean }>;
  objectsRef: MutableRefObject<Map<number, THREE.Object3D>>;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
}) {
  const texture = useMuseumImageTexture(art.photo.thumb.src, active);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (texture) invalidate();
  }, [texture, invalidate]);
  useEffect(() => {
    invalidate();
  }, [focused, hovered, invalidate]);

  const mat = MUSEUM.matBorder;
  const frame = MUSEUM.frameBorder;
  const depth = MUSEUM.frameDepth;
  const face = depth / 2;

  const onPointerOver = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive || gesture.current.moved) return;
    event.stopPropagation();
    onHover(art.index);
  };
  const onPointerOut = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    event.stopPropagation();
    onHover(null);
  };
  const onClick = (event: ThreeEvent<MouseEvent>) => {
    // A look-around drag ends in a click event too; the gesture flag is the only reliable discriminator.
    if (!interactive || gesture.current.moved) return;
    event.stopPropagation();
    onSelect(art.index);
  };

  return (
    <group
      position={art.position}
      rotation={[0, art.rotationY, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* Only the frame is registered for the photo-view FLIP bounds; the label below is part of
          the same visual unit but must not stretch the opening rectangle for the photograph. */}
      <group
        ref={(node) => {
          if (node) objectsRef.current.set(art.index, node);
          else objectsRef.current.delete(art.index);
        }}
      >
        <mesh>
          <boxGeometry args={[art.width + 2 * (mat + frame), art.height + 2 * (mat + frame), depth]} />
          <meshStandardMaterial color={hovered ? "#6b532e" : focused ? "#3a2a17" : CHARCOAL} roughness={0.52} metalness={0.16} />
        </mesh>
        <mesh position={[0, 0, face + 0.001]}>
          <planeGeometry args={[art.width + 2 * mat, art.height + 2 * mat]} />
          <meshStandardMaterial color={IVORY} roughness={0.95} metalness={0} />
        </mesh>
        {texture && (
          <mesh position={[0, 0, face + 0.002]}>
            <planeGeometry args={[art.width, art.height]} />
            {/* A little emissive keeps prints legible under gallery light without flattening the shading. */}
            <meshStandardMaterial
              map={texture}
              emissive="#ffffff"
              emissiveMap={texture}
              emissiveIntensity={hovered ? 0.85 : focused ? 0.62 : 0.3}
              roughness={0.9}
              metalness={0}
            />
          </mesh>
        )}
      </group>
      <DescriptionPanel art={art} active={active} />
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

/** The curved hall; navigation and raycast selection are owned by MuseumCanvas. */
export default function MuseumScene({
  layout,
  loadingIndices,
  activeIndex,
  hoverIndex,
  interactive,
  compact,
  gesture,
  objectsRef,
  onHover,
  onSelect,
}: SceneProps) {
  // Same lighting design, fewer dynamic lights on the small GPU budget: every other fixture is
  // enough to keep the hall even because ambient/hemisphere/directional fill stays unchanged.
  const lights = compact ? layout.lights.filter((_, index) => index % 2 === 0).slice(0, 4) : layout.lights;
  return (
    <>
      <ambientLight intensity={0.7} color="#fff6ea" />
      <hemisphereLight args={["#fff6ea", "#6b6256", 0.5]} />
      <directionalLight position={[2, 6, 4]} intensity={0.6} color="#fff4e4" />
      <CurvedShell layout={layout} />
      {layout.artworks.map((art) => (
        <FramedArtwork
          key={art.key}
          art={art}
          active={loadingIndices.has(art.index)}
          focused={art.index === activeIndex}
          hovered={art.index === hoverIndex}
          interactive={interactive}
          gesture={gesture}
          objectsRef={objectsRef}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      {layout.markers.map((marker) => (
        <SitePlaque key={marker.key} marker={marker} />
      ))}
      {lights.map((position, index) => (
        <pointLight
          key={index}
          position={position}
          intensity={compact ? 18 : 22}
          distance={compact ? 14 : 16}
          decay={2}
          color="#fff1dc"
        />
      ))}
    </>
  );
}
