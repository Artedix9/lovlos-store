import type { Metadata } from "next";
import StudioContent from "./StudioContent";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "The LOVLOS creative studio — editorial campaigns, technical detail, and the philosophy behind the vibe.",
};

export default function StudioPage() {
  return <StudioContent />;
}
