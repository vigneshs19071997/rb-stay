// Edge-safe constants shared between the middleware (Edge runtime) and the
// Node-runtime auth helpers. Keeping these here avoids pulling Node-only
// dependencies (e.g. bcryptjs) into the Edge middleware bundle.

export const SESSION_COOKIE = "rbcs_session";

// Session lifetime in seconds (7 days).
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

// Room type options for 2 BHK homes.
export const ROOM_TYPES = [
  { id: "non_ac_non_ac",label: "2 Non-AC rooms",        price: 2100 },
  { id: "ac_non_ac",    label: "1 AC + 1 Non-AC room", price: 2400 },
  { id: "ac_ac",        label: "2 AC rooms",            price: 3200 },
] as const;

export type RoomTypeId = (typeof ROOM_TYPES)[number]["id"];

export function getRoomType(id: string) {
  return ROOM_TYPES.find((r) => r.id === id);
}
