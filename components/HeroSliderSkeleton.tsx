// HeroSliderSkeleton - Loading placeholder for HeroSlider
export default function HeroSliderSkeleton() {
  return (
    <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 py-20 overflow-hidden relative min-h-[600px]">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center min-h-[600px]">
          {/* Left content skeleton */}
          <div className="text-white animate-pulse space-y-6">
            <div className="h-12 w-48 bg-white/20 rounded-full" />
            <div className="space-y-4">
              <div className="h-16 w-full bg-white/20 rounded-lg" />
              <div className="h-16 w-3/4 bg-white/20 rounded-lg" />
            </div>
            <div className="h-6 w-full max-w-md bg-white/20 rounded" />
            <div className="h-14 w-64 bg-white/20 rounded-full mt-8" />
          </div>

          {/* Right content skeleton */}
          <div className="relative h-[500px] hidden md:block">
            <div className="absolute top-1/2 -translate-y-1/2 w-full">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <div className="aspect-[4/3] rounded-2xl bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation dots skeleton */}
        <div className="flex items-center justify-center gap-6 mt-12">
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-3 rounded-full bg-white/30 animate-pulse ${
                  i === 1 ? 'w-12' : 'w-3'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
