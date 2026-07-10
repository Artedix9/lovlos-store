import type { Metadata } from "next";
import InfoPage, { InfoSection } from "@/components/InfoPage";
import SizeChartTable from "@/components/SizeChartTable";
import { SIZE_CHARTS, MEASURE_TIPS } from "@/lib/sizeGuide";

export const metadata: Metadata = {
  title: "Size Guide — LOVLOS",
  description: "LOVLOS size charts for women and men, with measurements in centimetres and tips on how to measure.",
};

export default function SizeGuidePage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Size Guide"
      intro="All measurements are body measurements in centimetres. Between sizes? We recommend sizing up for a relaxed fit."
    >
      <InfoSection title="Women">
        <SizeChartTable chart={SIZE_CHARTS.women} />
      </InfoSection>

      <InfoSection title="Men">
        <SizeChartTable chart={SIZE_CHARTS.men} />
      </InfoSection>

      <InfoSection title="How to Measure">
        <ul className="space-y-3">
          {MEASURE_TIPS.map((item) => (
            <li key={item.label}>
              <strong className="text-primary">{item.label} — </strong>
              {item.tip}
            </li>
          ))}
        </ul>
        <p className="text-chicago">
          Still unsure? WhatsApp us at{" "}
          <a
            href="https://wa.me/255692928552"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-chicago transition-colors duration-200"
          >
            +255 692 928 552
          </a>{" "}
          and we&apos;ll help you choose.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
