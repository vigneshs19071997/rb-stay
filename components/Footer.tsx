import Link from "next/link";

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=RB+Comfort+Stay+Sathuvachari+Vellore+632009";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-palm-800/10 bg-palm-900 text-jasmine-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-marigold-500 font-display text-lg text-palm-900">
              RB
            </span>
            <span className="font-display text-lg">RB Comfort Stay</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-jasmine-100/70">
            A warm, homely place to stay in Vellore. Two fully-furnished homes, each comfortable for up to 5 guests.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-marigold-400">Visit us</h4>
          <p className="mt-4 text-sm leading-relaxed text-jasmine-100/80">
            W5RP+4CF, MGC Nagar, Postal Nagar,<br />
            Alamelumangapuram, Sathuvachari,<br />
            Vellore, Tamil Nadu 632009
          </p>
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-marigold-400 underline-offset-4 hover:underline">
            Open in Google Maps →
          </a>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-marigold-400">Contact</h4>
          <a href="tel:+919092189883" className="mt-4 block text-sm text-jasmine-100/80 hover:text-jasmine-50">
            +91 90921 89883
          </a>
          <div className="mt-5 flex flex-col gap-1.5 text-sm text-jasmine-100/70">
            <Link href="/book" className="hover:text-jasmine-50">Book a stay</Link>
            <Link href="/login" className="hover:text-jasmine-50">Sign in</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-jasmine-100/10 px-5 py-5 text-center text-xs text-jasmine-100/50">
        © {new Date().getFullYear()} RB Comfort Stay, Vellore. All rights reserved.
      </div>
    </footer>
  );
}
