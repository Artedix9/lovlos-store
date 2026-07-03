"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { SIZE_CHARTS, MEASURE_TIPS, chartForCategory } from "@/lib/sizeGuide";
import SizeChartTable from "@/components/SizeChartTable";

/** Size guide dialog opened from the PDP. Render inside <AnimatePresence>. */
export default function SizeGuideModal({
  category,
  onClose,
}: {
  category: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"women" | "men">(chartForCategory(category));
  /* Traps Tab inside the dialog, closes on Escape, restores focus on exit */
  const trapRef = useFocusTrap<HTMLDivElement>(true, onClose);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <motion.div
      key="size-guide-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[500] bg-primary/60 flex items-end sm:items-center justify-center sm:p-6"
      onClick={onClose}
    >
      <motion.div
        ref={trapRef}
        key="size-guide-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Size guide"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-white w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-5 border-b border-mercury">
          <h2 className="text-xs font-black tracking-ultra uppercase text-primary">
            Size Guide
          </h2>
          <button
            onClick={onClose}
            aria-label="Close size guide"
            className="text-chicago hover:text-primary transition-colors duration-200 p-2 -mr-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6">
          {/* Women / Men tabs */}
          <div className="flex gap-6 mb-6 border-b border-mercury" role="tablist" aria-label="Size chart">
            {(Object.keys(SIZE_CHARTS) as ("women" | "men")[]).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={[
                  "pb-3 text-xs tracking-widest uppercase transition-colors duration-150 border-b -mb-px",
                  tab === key
                    ? "text-primary border-primary font-bold"
                    : "text-chicago border-transparent hover:text-primary",
                ].join(" ")}
              >
                {SIZE_CHARTS[key].label}
              </button>
            ))}
          </div>

          <SizeChartTable chart={SIZE_CHARTS[tab]} />

          {/* How to measure */}
          <div className="mt-8 border-t border-mercury pt-6">
            <p className="text-[10px] font-bold tracking-ultra uppercase text-chicago mb-4">
              How to Measure
            </p>
            <ul className="space-y-3">
              {MEASURE_TIPS.map((item) => (
                <li key={item.label} className="text-sm text-mine leading-relaxed tracking-wide">
                  <span className="font-bold text-primary">{item.label} — </span>
                  {item.tip}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-chicago tracking-wide leading-relaxed">
              Between sizes? We recommend sizing up for a relaxed fit. Still unsure?
              WhatsApp us at +255 746 704 036 and we&apos;ll help you choose.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
