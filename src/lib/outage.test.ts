// @vitest-environment node
import { describe, expect, it } from "vitest";
import { criticalBackupHours, usableKwh, simulateOutage, LOADS } from "./outage";
import { ASSUMPTIONS } from "./energy";

describe("critical backup hours", () => {
  it("matches the SPEC-05 resilience formula (usable / critical load)", () => {
    const usable = usableKwh(10);
    expect(criticalBackupHours(usable)).toBeCloseTo(usable / ASSUMPTIONS.criticalLoadKw, 1);
  });

  it("scales with battery size", () => {
    expect(criticalBackupHours(usableKwh(20))).toBeGreaterThan(criticalBackupHours(usableKwh(10)));
  });
});

describe("outage simulation", () => {
  it("drains the battery so a later hour has a lower state of charge", () => {
    const { timeline } = simulateOutage({
      batteryKwh: 10,
      pvKwp: 8,
      season: "winter",
      solarRecharge: false,
    });
    expect(timeline[0]!.socPercent).toBeGreaterThan(timeline[10]!.socPercent);
  });

  it("a zero battery powers nothing and gives no backup", () => {
    const { timeline, backupHours } = simulateOutage({
      batteryKwh: 0,
      pvKwp: 0,
      season: "winter",
      solarRecharge: false,
    });
    expect(backupHours).toBe(0);
    expect(timeline[0]!.loadsOn).toHaveLength(0);
  });

  it("daytime solar recharge keeps the battery fuller, more so in summer", () => {
    const noSun = simulateOutage(
      { batteryKwh: 10, pvKwp: 8, season: "summer", solarRecharge: false },
      30,
    );
    const summerSun = simulateOutage(
      { batteryKwh: 10, pvKwp: 8, season: "summer", solarRecharge: true },
      30,
    );
    const winterSun = simulateOutage(
      { batteryKwh: 10, pvKwp: 8, season: "winter", solarRecharge: true },
      30,
    );
    const end = (r: { timeline: { soc: number }[] }) => r.timeline[r.timeline.length - 1]!.soc;
    expect(end(summerSun)).toBeGreaterThan(end(noSun));
    expect(end(summerSun)).toBeGreaterThanOrEqual(end(winterSun));
  });

  it("runs everything on a full battery and sheds the heaviest load first as it empties", () => {
    const { timeline } = simulateOutage({
      batteryKwh: 10,
      pvKwp: 0,
      season: "winter",
      solarRecharge: false,
    });
    // A full battery powers the critical heat-pump load.
    expect(timeline[0]!.loadsOn).toContain("varmepumpe");
    // As the battery empties, the heavy heat pump drops while small loads continue.
    const afterPump = timeline.find(
      (h) => h.loadsOn.length > 0 && !h.loadsOn.includes("varmepumpe"),
    );
    expect(afterPump).toBeDefined();
    expect(LOADS.find((l) => l.id === "varmepumpe")!.priority).toBe(1);
  });
});
