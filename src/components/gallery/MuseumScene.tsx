"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

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
function FramedArtwork({ art, active }: { art: MuseumArtwork; active: boolean }) {
  const texture = useMuseumImageTexture(art.photo.thumb.src, active);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (texture) invalidate();
  }, [texture, invalidate]);

  const mat = MUSEUM.matBorder;
  const frame = MUSEUM.frameBorder;
  const depth = MUSEUM.frameDepth;
  const face = depth / 2;
  return (
    <group position={art.position} rotation={[0, art.rotationY, 0]}>
      <mesh>
        <boxGeometry args={[art.width + 2 * (mat + frame), art.height + 2 * (mat + frame), depth]} />
        <meshStandardMaterial color={CHARCOAL} roughness={0.52} metalness={0.16} />
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
            emissiveIntensity={0.3}
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

function Hall({ hall, active, lang }: { hall: MuseumHall; active: boolean; lang: Locale }) {
  return (
    <group>
      {hall.surfaces.map((surface) => (
        <Surface key={surface.key} surface={surface} />
      ))}
      {hall.artworks.map((art) => (
        <FramedArtwork key={art.key} art={art} active={active} />
      ))}
      {hall.alcoves.map((alcove) => (
        <group key={alcove.key}>
          {alcove.surfaces.map((surface) => (
            <Surface key={surface.key} surface={surface} />
          ))}
          {alcove.artworks.map((art) => (
            <FramedArtwork key={art.key} art={art} active={active} />
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

/** Static exhibition space only: no camera movement, raycasting or photo-view handoff yet. */
export default function MuseumScene({ halls, activeHalls, lang }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.7} color="#fff6ea" />
      <hemisphereLight args={["#fff6ea", "#6b6256", 0.5]} />
      <directionalLight position={[2, 6, 4]} intensity={0.6} color="#fff4e4" />
      {halls.map((hall, index) => (
        <Hall key={hall.slug} hall={hall} active={index < activeHalls} lang={lang} />
      ))}
    </>
  );
}
