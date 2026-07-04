import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrdersContent from "./OrdersContent";

export const metadata: Metadata = {
  title: "My Orders — LOVLOS",
  description: "Orders placed from this device, with live delivery status.",
};

export default function OrdersPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="max-w-3xl mx-auto px-6 md:px-10 py-14 md:py-20 min-h-[60vh]">
        <OrdersContent />
      </main>
      <Footer />
    </>
  );
}
