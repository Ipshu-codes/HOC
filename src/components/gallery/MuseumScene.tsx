"use client";

import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, type MutableRefObject } from "react";
import * as THREE from "three";

import { MUSEUM, type MuseumArtwork, type MuseumHall, type MuseumSurface } from "@/lib/museum-layout";
import type { Locale } from "@/types/locale";
import { useMuseumImageTexture, useMuseumTextTexture } from "./useMuseumTextures";

/** Gallery-scoped neutral palette (mirrors the CSS tokens in globals.css). No site-specific detail. */
const STONE = "#c9bca8";
const SANDSTONE = "#d8c6a8";
const IVORY = "#f4efe4";
const CONCRETE = "#a8a198";
const CHARCOAL = "#272522";

interface SceneProps {
  halls: MuseumHall[];
  activeHalls: number;
  lang: Locale;
  /** Photo index currently under the spotlight (from the nearest artwork or DOM focus). */
  activeIndex: number;
  hoverIndex: number | null;
  interactive: boolean;
  gesture: MutableRefObject<{ moved: boolean }>;
  objectsRef: MutableRefObject<Map<number, THREE.Object3D>>;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
}

function Surface({ surface }: { surface: MuseumSurface }) {
  const color = surface.kind === "floor" ? CONCRETE : surface.kind === "ceiling" ? IVORY : surface.kind === "wall" && surface.key.includes("alcove") ? SANDSTONE : STONE;
  return (
    <mesh position={surface.position}>
      <boxGeometry args={surface.size} />
      <meshStandardMaterial color={color} roughness={0.96} metalness={0} />
    </mesh>
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
      ref={(node) => {
        if (node) objectsRef.current.set(art.index, node);
        else objectsRef.current.delete(art.index);
      }}
      position={art.position}
      rotation={[0, art.rotationY, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
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
  );
}

/** The site's existing name and number, drawn with the page's own fonts (EN or NE). */
function HallPlaque({ hall, active, lang }: { hall: MuseumHall; active: boolean; lang: Locale }) {
  const texture = useMuseumTextTexture({ number: hall.number, name: hall.name, lang }, active);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (texture) invalidate();
  }, [texture, invalidate]);
  return (
    <group position={hall.plaque.position} rotation={[0, hall.plaque.rotationY, 0]}>
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

function Hall({
  hall,
  active,
  lang,
  activeIndex,
  hoverIndex,
  interactive,
  gesture,
  objectsRef,
  onHover,
  onSelect,
}: Omit<SceneProps, "halls" | "activeHalls"> & { hall: MuseumHall; active: boolean }) {
  const artworkProps = {
    active,
    hovered: false,
    interactive,
    gesture,
    objectsRef,
    onHover,
    onSelect,
  };
  return (
    <group>
      {hall.surfaces.map((surface) => (
        <Surface key={surface.key} surface={surface} />
      ))}
      {hall.artworks.map((art) => (
        <FramedArtwork
          key={art.key}
          {...artworkProps}
          art={art}
          focused={art.index === activeIndex}
          hovered={art.index === hoverIndex}
        />
      ))}
      {hall.alcoves.map((alcove) => (
        <group key={alcove.key}>
          {alcove.surfaces.map((surface) => (
            <Surface key={surface.key} surface={surface} />
          ))}
          {alcove.artworks.map((art) => (
            <FramedArtwork
              key={art.key}
              {...artworkProps}
              art={art}
              focused={art.index === activeIndex}
              hovered={art.index === hoverIndex}
            />
          ))}
        </group>
      ))}
      <HallPlaque hall={hall} active={active} lang={lang} />
      {hall.lights.map((position, index) => (
        <pointLight key={index} position={position} intensity={22} distance={16} decay={2} color="#fff1dc" />
      ))}
    </group>
  );
}

/** The exhibition space; navigation and raycast selection are owned by MuseumCanvas. */
export default function MuseumScene({
  halls,
  activeHalls,
  lang,
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
      {halls.map((hall, index) => (
        <Hall
          key={hall.slug}
          hall={hall}
          active={index < activeHalls}
          lang={lang}
          activeIndex={activeIndex}
          hoverIndex={hoverIndex}
          interactive={interactive}
          gesture={gesture}
          objectsRef={objectsRef}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
