/**
 * The example house with a buyer's choices: the rooms, inner walls, openings and furniture of the
 * plan (plan.ts) as one object, so the inside, its light and the walk all read the same variant.
 *
 * The lower floor (on the 18 plots that have one) can be:
 *   finished        the model's family room and two bedrooms
 *   three-bedrooms  the family room furnished as a bedroom
 *   rental          a rental unit: its own front door to the patio, a kitchenette in the family room,
 *                   and a door at the foot of the stair that closes it off from the house above
 *   shell           left unfinished for later: no inner walls, a screed floor, used as storage
 * With a stove, a clean-burning wood stove stands in the living room's corner under the north slope,
 * its flue going up through the roof to the chimney.
 *
 * Everything here is an illustration of a choice, like the house itself: the project has no house design.
 */
import { HOUSE, ITEMS, OPENINGS, PARTITIONS, ROOMS, type Item, type Opening, type Partition, type Room } from "./plan";
import type { LowerVariant, Stove } from "./options";

export type Plan = {
  rooms: Room[];
  partitions: Partition[];
  openings: Opening[];
  items: Item[];
  /** depth of the terrace on the view side (m) */
  terraceDepth: number;
  lower: LowerVariant;
  stove: Stove;
};

/** The model's own plan. */
export const MODEL_PLAN: Plan = { rooms: ROOMS, partitions: PARTITIONS, openings: OPENINGS, items: ITEMS, terraceDepth: HOUSE.terraceDepth, lower: "finished", stove: "none" };

const n = (no: string, en: string) => ({ no, en });
const I = HOUSE.iw, J = HOUSE.id;
const it = (kind: Item["kind"], room: Item["room"], at: [number, number], rot: Item["rot"], size: [number, number, number], extra: Partial<Item> = {}): Item => ({ kind, level: room === "living" ? "main" : "lower", room, at, rot, size, lowerOnly: room !== "living", ...extra });

/** The family room's furniture in the model (left out when the room is used another way). */
const FAMILY_FURNITURE = new Set(["sofa", "rug", "coffeetable", "tv", "sideboard", "plant"]);

/** The plan for a set of choices (the lower variant applies only where the house has a lower floor). */
export function planFor(lower: LowerVariant, stove: Stove, terraceDepth: number = HOUSE.terraceDepth): Plan {
  if (lower === "finished" && stove === "none" && terraceDepth === HOUSE.terraceDepth) return MODEL_PLAN;
  let rooms = ROOMS, partitions = PARTITIONS, openings = OPENINGS, items = ITEMS;

  if (lower === "three-bedrooms") {
    rooms = ROOMS.map((r) => (r.id === "family" ? { ...r, name: n("Soverom 4", "Bedroom 4") } : r));
    items = [
      ...ITEMS.filter((x) => !(x.room === "family" && FAMILY_FURNITURE.has(x.kind))),
      // the bed's head against the back wall, clear of the stair's foot and the doors on both sides
      it("bed", "family", [0.2, 0.5], 0, [1.6, 2.0, 0.5]),
      it("nightstand", "family", [-0.85, -0.28], 0, [0.42, 0.4, 0.5]),
      it("rug", "family", [0.2, 1.0], 0, [2.2, 1.6, 0.01], { variant: 1 }),
      it("wardrobe", "family", [1.95, 3.6], 2, [1.2, 0.6, 2.2]),
    ];
  }

  if (lower === "rental") {
    // a lobby at the foot of the stair, with the storage room, closed off by a door from the rental unit
    rooms = [
      { id: "hall2", level: "lower", rect: { u0: 1.14, u1: 2.55, v0: -0.5, v1: 0.75 }, name: n("Gang", "Hallway"), floor: "oak", ceiling: "flat", lowerOnly: true },
      ...ROOMS.map((r) => (r.id === "family" ? { ...r, name: n("Stue og kjøkken, utleiedel", "Living room and kitchen, rental unit") } : r)),
    ];
    partitions = [
      ...PARTITIONS,
      { id: "r-stair-side", level: "lower", rect: { u0: 1.02, u1: 1.14, v0: -0.5, v1: 0.87 }, lowerOnly: true, doors: [] },
      { id: "r-stair-front", level: "lower", rect: { u0: 1.14, u1: 2.55, v0: 0.75, v1: 0.87 }, lowerOnly: true, doors: [{ id: "d-rental-inner", at: 1.84, w: 0.9, hinge: "lo", into: 1, room: "family" }] },
    ];
    // its own front door beside a narrower sliding door to the patio
    openings = [
      ...OPENINGS.map((o) => (o.id === "d-garden" ? { ...o, c: 0.1, w: 1.8 } : o)),
      { id: "d-rental", side: "front", level: "lower", c: 1.75, w: 1.0, z0: 0.0, z1: 2.1, kind: "entry", room: "family", lowerOnly: true },
    ];
    items = [
      ...ITEMS.filter((x) => !(x.room === "family" && (x.kind === "sofa" || x.kind === "coffeetable" || x.kind === "rug" || x.kind === "plant"))),
      // the kitchenette along the back wall: base units with the sink and a two-zone hob, a fridge column
      it("kitchenBase", "family", [-0.48, -0.19], 0, [1.8, 0.62, 0.9], { variant: 2 }),
      it("kitchenTall", "family", [0.72, -0.19], 0, [0.6, 0.62, 2.0], { variant: 0 }),
      it("sofa", "family", [0.1, 1.1], 0, [2.2, 0.9, 0.8], { variant: 1 }),
      it("rug", "family", [0.1, 2.0], 0, [2.2, 1.5, 0.01], { variant: 1 }),
      it("coffeetable", "family", [0.1, 2.05], 0, [1.0, 0.6, 0.38]),
      it("downlight", "hall2", [1.85, 0.2], 0, [0.1, 0.1, 0.02], { ceil: true }),
    ];
  }

  if (lower === "shell") {
    // one open space: no inner walls, nothing but storage
    rooms = ROOMS.filter((r) => r.level === "main" || r.id === "stair").concat([
      { id: "family", level: "lower", rect: { u0: -I, u1: I, v0: HOUSE.lowerBack + HOUSE.wall, v1: J }, name: n("Uinnredet underetasje", "Unfinished lower floor"), floor: "stone", ceiling: "flat", lowerOnly: true },
    ]);
    partitions = PARTITIONS.filter((p) => p.level === "main");
    items = [
      ...ITEMS.filter((x) => x.level === "main" || x.kind === "skis" || x.kind === "boxes" || (x.kind === "shelf" && x.variant === 1) || (x.kind === "downlight" && (x.room === "family" || x.room === "store"))).map((x) => (x.room === "store" || x.room === "family" ? { ...x, room: "family" as const } : x)),
      it("boxes", "family", [-4.3, 3.3], 1, [1.0, 0.5, 0.6]),
      it("shelf", "family", [-3.5, -0.32], 0, [2.4, 0.35, 1.9], { variant: 1 }),
    ];
  }

  if (stove !== "none") {
    items = [
      // the bookcase made narrower, so the stove has its corner
      ...items.map((x) => (x.kind === "bookcase" ? { ...x, at: [3.9, -0.92] as [number, number], size: [1.0, 0.34, 2.0] as [number, number, number] } : x)),
      it("stove", "living", [4.72, -0.6], 3, [0.5, 0.45, 1.1], { variant: stove === "stove" ? 0 : 1 }),
    ];
  }

  return { rooms, partitions, openings, items, terraceDepth, lower, stove };
}

/** Where the chimney leaves the roof (house frame): above the stove, on the north slope. */
export const CHIMNEY = { u: 4.72, v: -0.6 };
