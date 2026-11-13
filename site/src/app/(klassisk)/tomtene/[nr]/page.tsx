import PlotPage from "@/components/klassisk/plots/PlotPage";
import { plotMetadata, plotParams } from "@/components/klassisk/plots/plotMeta";

type Props = { params: Promise<{ nr: string }> };

export const generateStaticParams = plotParams;

export async function generateMetadata({ params }: Props) {
  return plotMetadata((await params).nr, "no");
}

export default async function Tomt({ params }: Props) {
  return <PlotPage nr={(await params).nr} locale="no" />;
}
