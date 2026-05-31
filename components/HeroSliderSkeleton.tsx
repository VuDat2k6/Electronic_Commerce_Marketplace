// HeroSliderSkeleton - Loading placeholder for HeroSlider
export default function HeroSliderSkeleton() {
  return (
    <div className="relative min-h-[600px] overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 py-20">
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <div className="grid min-h-[600px] items-center gap-12 md:grid-cols-2">
          <div className="animate-pulse space-y-6 text-white">
            <div className="h-12 w-48 rounded-full bg-white/20" />
            <div className="space-y-4">
              <div className="h-16 w-full rounded-lg bg-white/20" />
              <div className="h-16 w-3/4 rounded-lg bg-white/20" />
            </div>
            <div className="h-6 w-full max-w-md rounded bg-white/20" />
            <div className="mt-8 h-14 w-64 rounded-full bg-white/20" />
          </div>
          <div className="relative hidden h-[500px] md:block">
            <div className="absolute top-1/2 w-full -translate-y-1/2">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-lg">
                <div className="aspect-[4/3] animate-pulse rounded-2xl bg-white/20" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 flex items-center justify-center gap-6">
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className={`h-3 animate-pulse rounded-full bg-white/30 ${item === 1 ? "w-12" : "w-3"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
