import Header from "@/components/Header";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero
        desktopSrc="/Main Hero Banner-4.png"
        mobileSrc="/Main Hero Banner-Mobile.png"
      />
    </main>
  );
}
