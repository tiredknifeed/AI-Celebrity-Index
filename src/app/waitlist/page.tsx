import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import Waitlist from "@/components/Waitlist";
import { leaderboard } from "@/lib/waitlist";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description: "Claim your spot with your X handle, complete quick tasks and invite friends to earn AI Fame Index airdrop points.",
};

// the leaderboard is live
export const dynamic = "force-dynamic";

export default async function WaitlistPage() {
  const board = await leaderboard().catch(() => ({ total: 0, top: [] as { handle: string; points: number }[] }));
  return (
    <>
      <PageHead
        kicker={`Founding fans${board.total > 0 ? ` · ${board.total} on the list` : ""}`}
        title={
          <>
            Join the
            <br />
            waitlist
          </>
        }
        intro="Drop your X handle to claim your spot. Quick tasks and invites move you up the list and earn airdrop points."
      />
      <section className="wrap">
        <Waitlist initialTotal={board.total} initialTop={board.top} />
      </section>
    </>
  );
}
