"use client";

import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, type MutableRefObject } from "react";
import * as THREE from "three";

import {
  MUSEUM,
  type MuseumArtwork,
  type MuseumLayout,
  type MuseumMarker,
  type MuseumSurface,
} from "@/lib/museum-layout";
import { useMuseumDescriptionTexture, useMuseumImageTexture, useMuseumTextTexture } from "./useMuseumTextures";

/** Gallery-scoped neutral palette (mirrors the CSS tokens in globals.css). No site-specific detail. */
const STONE = "#c9bca8";
const SANDSTONE = "#d8c6a8";
const IVORY = "#f4efe4";
const PANEL = "#e7dbc6";
const CONCRETE = "#a8a198";
const CHARCOAL = "#272522";

interface SceneProps {
  layout: MuseumLayout;
  /** Growing set of frames whose thumbnails have been requested; loaded ones never go blank. */
  loadingIndices: ReadonlySet<number>;
  activeIndex: number;
  hoverIndex: number | null;
  interactive: boolean;
  gesture: MutableRefObject<{ moved: boolean }>;
  objectsRef: MutableRefObject<Map<number, THREE.Object3D>>;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
}

function surfaceColor(surface: MuseumSurface): string {
  if (surface.kind === "floor") return CONCRETE;
  if (surface.kind === "ceiling") return IVORY;
  if (surface.kind === "panel") return PANEL;
  if (surface.key === "corridor-left") return STONE;
  return SANDSTONE;
}

function Surface({ surface }: { surface: MuseumSurface }) {
  return (
    <mesh position={surface.position}>
      <boxGeometry args={surface.size} />
      <meshStandardMaterial color={surfaceColor(surface)} roughness={0.96} metalness={0} />
    </mesh>
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
  return (
    <group position={marker.position} rotation={[0, marker.rotationY, 0]}>
      <mesh>
        <boxGeometry args={[MUSEUM.plaqueWidth, MUSEUM.plaqueHeight, 0.06]} />
        <meshStandardMaterial color={IVORY} roughness={0.9} metalness={0} />
      </mesh>
      {texture && (
        <mesh position={[0, 0, 0.031]}>
          <planeGeometry args={[MUSEUM.plaqueWidth - 0.08, MUSEUM.plaqueHeight - 0.06]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** The corridor; navigation and raycast selection are owned by MuseumCanvas. */
export default function MuseumScene({
  layout,
  loadingIndices,
  activeIndex,
  hoverIndex,
  interactive,
  gesture,
  objectsRef,
  onHover,
  onSelect,
}: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.7} color="#fff6ea" />
      <hemisphereLight args={["#fff6ea", "#6b6256", 0.5]} />
      <directionalLight position={[2, 6, 4]} intensity={0.6} color="#fff4e4" />
      {layout.surfaces.map((surface) => (
        <Surface key={surface.key} surface={surface} />
      ))}
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
      {layout.lights.map((position, index) => (
        <pointLight key={index} position={position} intensity={22} distance={16} decay={2} color="#fff1dc" />
      ))}
    </>
  );
}
