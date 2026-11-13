import { klassiskMeta } from "@/lib/meta";
import PhotosPage from "@/components/klassisk/plots/PhotosPage";

export const metadata = klassiskMeta("/galleri", { title: "Bilder", description: "Utsikten fra Knotten, fotografiet satt mot modellen, siktkorridoren mot havet og bilder fra området rundt Sniksfjorden, med fotograf og lisens." });

export default function Galleri() {
  return <PhotosPage locale="no" />;
}
