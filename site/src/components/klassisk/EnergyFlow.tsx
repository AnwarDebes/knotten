import EnergySystem from "@/components/energy/EnergySystem";

/** The system sketch of the owner's energy direction in the Klassisk look (the drawing itself is shared with Moderne). */
export default function EnergyFlow({ locale = "no" }: { locale?: "no" | "en" }) {
  return (
    <div className="sysd">
      <EnergySystem variant="klassisk" locale={locale} />
    </div>
  );
}
