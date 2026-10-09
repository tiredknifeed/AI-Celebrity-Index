import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Mono, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PortraitRegistry from "@/components/PortraitRegistry";
import { getData, getLivePortraits } from "@/lib/live";
import { longDate } from "@/lib/format";

// Re-read live user submissions at most every 30 s (the submit route also refreshes at once).
export const revalidate = 30;

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700", "800"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = DM_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "AI Fame Index — Who owns the internet today?", template: "%s · AI Fame Index" },
  description:
    "The live index of AI celebrities: Fame, Momentum, social graph and career arcs of fictional AI influencers and synthetic personalities.",
};

export const viewport: Viewport = { themeColor: "#F4F1EA" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { AS_OF, characters, universeOf } = await getData();
  const livePortraits = await getLivePortraits();
  const items = characters.map((c) => ({
    slug: c.slug,
    name: c.name,
    handle: c.handle,
    rank: c.ranks?.index ?? null,
    universe: universeOf(c.universe)?.name ?? null,
  }));
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        <PortraitRegistry map={livePortraits} />
        <Nav items={items.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))} asOf={longDate(AS_OF)} />
        <main>{children}</main>
        <Footer asOf={AS_OF} />
      </body>
    </html>
  );
}
