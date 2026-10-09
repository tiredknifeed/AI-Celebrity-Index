import type { Metadata } from "next";
import AvatarBackfill from "@/components/AvatarBackfill";
import PageHead from "@/components/PageHead";

export const metadata: Metadata = { title: "Avatar tool", robots: { index: false } };

export default function AvatarToolPage() {
  return (
    <>
      <PageHead
        kicker="Editors"
        title={<>Missing avatars</>}
        intro="Fetches the Instagram profile picture of every ranked character that still shows an illustration or a placeholder, then restyles it like the other avatars. Characters that already have a photo are skipped, so running it twice costs nothing."
      />
      <section className="wrap">
        <AvatarBackfill />
      </section>
    </>
  );
}
