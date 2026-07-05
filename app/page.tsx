import Link from "next/link";
import { ImageSlideshow } from "@/components/ImageSlideshow";

const MAP_EMBED =
  "https://maps.google.com/maps?q=RB%20Comfort%20Stay%20Sathuvachari%20Vellore%20632009&t=&z=15&ie=UTF8&iwloc=&output=embed";

const amenities = [
  "Up to 5 guests per home",
  "Fully-furnished rooms",
  "Modern kitchen",
  "Comfortable family living space",
  "Quiet residential location",
  "Easy Google Maps directions",
];

const rules = [
  "No smoking on premises",
  "No alcohol allowed",
  "Pets welcome",
];

const catchyFeatures = [
  {
    icon: "🏡",
    title: "Entire home provided",
    desc: "Not just a room — the whole home is yours for the duration of your stay.",
  },
  {
    icon: "🌿",
    title: "Feel right at home",
    desc: "Furnished and cared for just like a family home, because it is one.",
  },
  {
    icon: "✨",
    title: "A true homestay experience",
    desc: "Warm, personal, comfortable — everything you need, nothing you don't.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-palm-900 text-jasmine-50">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(216,155,58,0.35), transparent 40%), radial-gradient(circle at 80% 0%, rgba(216,155,58,0.18), transparent 45%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div className="animate-fade-in">
            <p className="eyebrow text-marigold-400">Homestay · Vellore, Tamil Nadu</p>
            <h1 className="mt-4 text-4xl leading-[1.1] text-jasmine-50 md:text-6xl">
              A comfortable home,<br />away from home.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-jasmine-100/75">
              RB Comfort Stay offers two warm, fully-furnished homes in Sathuvachari, Vellore — each
              perfect for families and small groups of up to five guests.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className="btn-accent">Check availability</Link>
              <a href="#location" className="btn-ghost border-jasmine-100/25 text-jasmine-50 hover:bg-jasmine-50/10">
                See location
              </a>
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="rounded-3xl border border-jasmine-100/15 bg-jasmine-50/5 p-6 backdrop-blur">
              <div className="rounded-2xl bg-jasmine-50 p-6 text-ink shadow-soft">
                <p className="eyebrow">Two homes available</p>
                <div className="mt-4 space-y-4">
                  {["Home 1", "Home 2"].map((h, i) => (
                    <div key={h} className="flex items-center justify-between rounded-xl bg-jasmine-100 px-4 py-3">
                      <div>
                        <p className="font-display text-lg text-palm-900">RB Comfort Stay · {h}</p>
                        <p className="text-xs text-ink/55">Sleeps up to 5 guests</p>
                      </div>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-palm-800 text-sm font-semibold text-marigold-400">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="/book" className="btn-primary mt-5 w-full">Book your dates</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catchy feature highlights */}
      <section className="border-b border-palm-800/8 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-5 md:grid-cols-3">
            {catchyFeatures.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-2xl bg-jasmine-100 p-5 transition hover:shadow-card"
              >
                <span className="mt-0.5 text-3xl">{f.icon}</span>
                <div>
                  <p className="font-display text-lg leading-snug text-palm-900">{f.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Homes — photo galleries */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow">Take a look inside</p>
        <h2 className="mt-3 text-3xl text-palm-900 md:text-4xl">Our two homes</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/60">
          Each home is fully-furnished and ready for your family. Browse the photos below to find your perfect stay.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {[
            { id: 1, label: "Home 1" },
            { id: 2, label: "Home 2" },
          ].map(({ id, label }) => (
            <div key={id} className="flex flex-col gap-4">
              <ImageSlideshow homeId={id} className="aspect-[4/3] w-full" />
              <div>
                <p className="font-display text-lg text-palm-900">RB Comfort Stay · {label}</p>
                <p className="text-xs text-ink/50">Sleeps up to 5 guests · Sathuvachari, Vellore</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Link href="/book" className="btn-primary">Check availability</Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow">Booking made simple</p>
        <h2 className="mt-3 text-3xl text-palm-900 md:text-4xl">Reserve in three easy steps</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Check availability", d: "Browse available dates and homes without signing up — booked dates are blocked automatically." },
            { n: "02", t: "Pick your home and dates", d: "Select one or both homes, choose your room type and number of guests, then pick your stay dates." },
            { n: "03", t: "Sign in and confirm", d: "Sign in or create a free account, and your booking is confirmed instantly." },
          ].map((s) => (
            <div key={s.n} className="card p-6">
              <span className="font-display text-3xl text-marigold-500">{s.n}</span>
              <h3 className="mt-3 text-xl text-palm-900">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Amenities */}
      <section className="bg-sage/50">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-start">
            <div>
              <p className="eyebrow">What's included</p>
              <h2 className="mt-3 text-3xl text-palm-900 md:text-4xl">Everything you need for a restful stay</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink/65">
                Both homes are kept clean, comfortable and ready for your family. Each can host up to
                five guests — we never overbook beyond that.
              </p>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-3">
                {amenities.map((a) => (
                  <div key={a} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-ink/80 shadow-card">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-palm-100 text-xs text-palm-800">✓</span>
                    {a}
                  </div>
                ))}
              </div>

              {/* House rules */}
              <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-palm-800/60">
                House rules
              </p>
              <div className="grid grid-cols-2 gap-3">
                {rules.map((r) => (
                  <div key={r} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-ink/80 shadow-card">
                    <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${
                      r.startsWith("No") ? "bg-red-50 text-red-500" : "bg-palm-100 text-palm-800"
                    }`}>
                      {r.startsWith("No") ? "✕" : "✓"}
                    </span>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section id="location" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow">Find us</p>
            <h2 className="mt-3 text-3xl text-palm-900 md:text-4xl">RB Comfort Stay, Sathuvachari</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/70">
              W5RP+4CF, MGC Nagar, Postal Nagar, Alamelumangapuram, Sathuvachari, Vellore,
              Tamil Nadu 632009
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              🛕 Very close to <span className="font-medium text-palm-900">Arulmigu Thirthagiri Murugan Temple</span>, Vellore — ideal for devotees and pilgrims visiting the temple.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-sm">
              <a href="tel:+919092189883" className="font-medium text-palm-800 hover:text-palm-900">📞 +91 90921 89883</a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=RB+Comfort+Stay+Sathuvachari+Vellore+632009"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-marigold-600 hover:text-marigold-500"
              >
                📍 Open in Google Maps →
              </a>
            </div>
            <Link href="/book" className="btn-primary mt-8">Book a stay</Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-palm-800/10 shadow-card">
            <iframe
              title="RB Comfort Stay location"
              src={MAP_EMBED}
              className="h-[340px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}
