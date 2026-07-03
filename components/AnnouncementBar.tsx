import { getAnnouncement } from "@/lib/settings";

/**
 * Site-wide announcement strip above the header. Text is edited in the
 * admin (Site & Banners tab); saving revalidates the whole layout so it
 * updates everywhere. Renders nothing when the text is empty.
 */
export default async function AnnouncementBar() {
  const text = await getAnnouncement();
  if (!text) return null;

  return (
    <div className="bg-primary text-white text-center px-4 py-2">
      <p className="text-[10px] tracking-widest uppercase">{text}</p>
    </div>
  );
}
