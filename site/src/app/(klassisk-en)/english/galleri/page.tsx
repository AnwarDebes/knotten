import { klassiskMeta } from "@/lib/meta";
import PhotosPage from "@/components/klassisk/plots/PhotosPage";

export const metadata = klassiskMeta("/galleri", { title: "Photos", description: "The view from Knotten, the photograph set against the model, the sight corridor to the sea and photos of the area around Sniksfjorden, with photographer and licence." }, { locale: "en" });

export default function Photos() {
  return <PhotosPage locale="en" />;
}
