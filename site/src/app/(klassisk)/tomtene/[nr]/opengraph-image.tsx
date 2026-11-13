import { plotShareImage, shareMetadata } from "@/components/klassisk/plots/shareImage";

type Params = { nr: string };

/** The plot's share card in the Klassisk palette, with its alt text (src/components/klassisk/plots/shareImage.tsx). */
export async function generateImageMetadata({ params }: { params?: Partial<Params> | Promise<Partial<Params>> }) {
  // the build also asks without a plot (to list the image), so the number is optional here
  const { nr } = (await params) ?? {};
  return shareMetadata(nr, "no");
}

export default async function Image({ params }: { params: Promise<Params> }) {
  return plotShareImage((await params).nr, "no");
}
