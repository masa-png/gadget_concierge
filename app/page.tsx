import { Features } from "./_components/features/home/features";
import { Hero } from "./_components/features/home/hero";
import { HowItWorks } from "./_components/features/home/how-it-works";
import { TrendInsights } from "./_components/features/home/trend-insights";

export default function HomePage() {
  return (
    <>
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <TrendInsights />
      </main>
    </>
  );
}
