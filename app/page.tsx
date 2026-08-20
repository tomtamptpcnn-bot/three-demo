import FuturisticHero from '@/components/FuturisticHero';

export default function Home() {
  return (
    <main>
      <FuturisticHero />

      <section className="flex h-screen items-center justify-center bg-black text-white">
        <h2 className="text-5xl font-bold">
          The Future Starts Here
        </h2>
      </section>
    </main>
  );
}