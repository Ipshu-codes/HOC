import { z } from "zod";

import { localized } from "@/types/common";
import { HERITAGE_SLUGS } from "@/types/heritage";

const latLng = z.tuple([z.number(), z.number()]); // [lat, lng], like all coordinates in content/

/**
 * One walked section between two consecutive stops, from a pedestrian router
 * (see scripts/fetch-walking-route.ts). Distances and times are the router's
 * numbers, never typed by hand.
 */
export const routeLegSchema = z.object({
  from: z.enum(HERITAGE_SLUGS),
  to: z.enum(HERITAGE_SLUGS),
  distanceMeters: z.number().positive(),
  durationSeconds: z.number().positive(),
  path: z.array(latLng).min(2),
});

/**
 * content/routes.json — predefined walking routes.
 * `stops` is the suggested order and may only name heritage sites. Stops that are
 * drafts (or have no coordinates) are skipped at build time, so a route never
 * mentions a site that is not published.
 * `walking` stays null until real pedestrian-route data has been fetched; until then
 * the map draws a dashed straight line and shows no walking distance or time.
 */
export const routeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: localized,
  intro: localized.optional(),
  stops: z.array(z.enum(HERITAGE_SLUGS)).min(2),
  walking: z
    .object({
      /** e.g. "OpenStreetMap data, routed with OSRM foot profile" */
      source: z.string().min(1),
      generatedOn: z.string().min(1),
      legs: z.array(routeLegSchema).min(1),
    })
    .nullable(),
});

export const routesFileSchema = z.object({ routes: z.array(routeSchema) });

export type RouteDefinition = z.infer<typeof routeSchema>;
