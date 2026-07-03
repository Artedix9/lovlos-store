/** Size chart data shared by the PDP modal and the /size-guide page. */

export interface SizeChart {
  label: string;
  /** Column headings after "Size" — measurements in cm */
  columns: string[];
  rows: { size: string; values: string[] }[];
}

export const SIZE_CHARTS: Record<"women" | "men", SizeChart> = {
  women: {
    label: "Women",
    columns: ["Bust (cm)", "Waist (cm)", "Hips (cm)"],
    rows: [
      { size: "XS", values: ["78–82", "60–64", "86–90"] },
      { size: "S", values: ["82–86", "64–68", "90–94"] },
      { size: "M", values: ["86–92", "68–74", "94–100"] },
      { size: "L", values: ["92–98", "74–80", "100–106"] },
      { size: "XL", values: ["98–104", "80–88", "106–112"] },
      { size: "2XL", values: ["104–112", "88–96", "112–120"] },
    ],
  },
  men: {
    label: "Men",
    columns: ["Chest (cm)", "Waist (cm)"],
    rows: [
      { size: "XS", values: ["86–91", "71–76"] },
      { size: "S", values: ["91–96", "76–81"] },
      { size: "M", values: ["96–102", "81–86"] },
      { size: "L", values: ["102–108", "86–92"] },
      { size: "XL", values: ["108–114", "92–98"] },
      { size: "2XL", values: ["114–120", "98–104"] },
    ],
  },
};

export const MEASURE_TIPS: { label: string; tip: string }[] = [
  {
    label: "Bust / Chest",
    tip: "Measure around the fullest part of your chest, keeping the tape level under your arms.",
  },
  {
    label: "Waist",
    tip: "Measure around your natural waistline — the narrowest part of your torso.",
  },
  {
    label: "Hips",
    tip: "Stand with feet together and measure around the fullest part of your hips.",
  },
];

/** Map a product category to its default chart tab. */
export function chartForCategory(category: string): "women" | "men" {
  return category.toLowerCase() === "men" ? "men" : "women";
}
