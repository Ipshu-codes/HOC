/**
 * Fetches real pedestrian routes for the stops in content/routes.json and writes them back into
 * that file (the "walking" part), so the map can draw the walking path and show walking distance/time.
 *
 *   npm run fetch-route
 *
 * Run this by hand, on a computer with internet, whenever the stops or their coordinates change,
 * then review and commit content/routes.json. It is NOT part of the build: the site stays fully static
 * and makes no routing requests while visitors use it.
 *
 * Data: OpenStreetMap, routed by the free community OSRM "foot" server (routing.openstreetmap.de).
 * It is a demo server: keep it to occasional use. The route runs between the coordinates stored in
 * content/heritage/*.md, which are only approximate for some sites (coordinatesApproximate), so the
 * ends of each walking path are approximate too. Check the result on the map before publishing.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROUTES_FILE = path.join("content", "routes.json");
const SERVER = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";

interface OsrmResponse {
  code: string;
  routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
}

function coordinatesOf(slug: string): [number, number] {
  const { data } = matter(fs.readFileSync(path.join("content", "heritage", `${slug}.en.md`), "utf8"));
  const coordinates = data.coordinates as [number, number] | null;
  if (!coordinates) throw new Error(`${slug} has no coordinates in its frontmatter`);
  return coordinates;
}

async function leg(from: string, to: string) {
  const [lat1, lng1] = coordinatesOf(from);
  const [lat2, lng2] = coordinatesOf(to);
  const url = `${SERVER}/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${from} → ${to}: HTTP ${response.status}`);
  const body = (await response.json()) as OsrmResponse;
  const route = body.routes?.[0];
  if (body.code !== "Ok" || !route) throw new Error(`${from} → ${to}: router answered "${body.code}"`);
  return {
    from,
    to,
    distanceMeters: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
    // GeoJSON is [lng, lat]; content uses [lat, lng].
    path: route.geometry.coordinates.map(([lng, lat]) => [Number(lat.toFixed(6)), Number(lng.toFixed(6))]),
  };
}

async function main() {
  const file = JSON.parse(fs.readFileSync(ROUTES_FILE, "utf8")) as {
    routes: { id: string; stops: string[]; walking: unknown }[];
  };
  for (const route of file.routes) {
    const legs = [];
    for (let i = 0; i < route.stops.length - 1; i++) {
      legs.push(await leg(route.stops[i], route.stops[i + 1]));
      console.log(`${route.id}: ${route.stops[i]} → ${route.stops[i + 1]}: ${legs.at(-1)?.distanceMeters} m`);
    }
    route.walking = {
      source: "OpenStreetMap contributors, routed with OSRM (foot profile)",
      generatedOn: new Date().toISOString().slice(0, 10),
      legs,
    };
  }
  fs.writeFileSync(ROUTES_FILE, `${JSON.stringify(file, null, 2)}\n`);
  console.log(`Wrote ${ROUTES_FILE}. Check the paths on the map before publishing.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
