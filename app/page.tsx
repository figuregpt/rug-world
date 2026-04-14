import RugHero from "@/components/RugHero";
import RugAbout from "@/components/RugAbout";
import RugHowItWorks from "@/components/RugHowItWorks";
import RugRoyalty from "@/components/RugRoyalty";
import RugFAQ from "@/components/RugFAQ";
import RugFooter from "@/components/RugFooter";

export default function Home() {
  return (
    <main className="relative">
      <RugHero />
      <RugAbout />
      <RugHowItWorks />
      <RugRoyalty />
      <RugFAQ />
      <RugFooter />
    </main>
  );
}
