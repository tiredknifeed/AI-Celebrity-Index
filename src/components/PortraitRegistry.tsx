"use client";

import { setLivePortraits, type PortraitSpec } from "@/data/portraits";

/** Hands the live portraits of user-added characters to client components. Renders nothing. */
export default function PortraitRegistry({ map }: { map: Record<string, PortraitSpec> }) {
  setLivePortraits(map);
  return null;
}
