import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { BookingFormWrapper } from "@/components/booking-form-wrapper";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function Home() {
  const show = await prisma.show.findFirst({
    where: { isActive: true },
    include: {
      customQuestions: { orderBy: { order: "asc" } },
      dates: {
        where: { isAvailable: true },
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      },
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {show ? (
          <>
            {/* Hero */}
            <section className="bg-navy-card border-b border-navy-light">
              <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">
                    Now Touring
                  </p>
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
                    {show.title}
                  </h1>
                  <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                    {show.description}
                  </p>
                  <a
                    href="#booking"
                    className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-gold text-navy font-semibold rounded-md hover:bg-gold-light transition-colors"
                  >
                    Book Now →
                  </a>
                </div>
                {show.images.length > 0 && (
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-2xl">
                    <Image
                      src={show.images[0]}
                      alt={show.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Gallery */}
            {show.images.length > 1 && (
              <section className="max-w-6xl mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {show.images.slice(1).map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden"
                    >
                      <Image
                        src={src}
                        alt={`${show.title} photo ${i + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Booking Form */}
            <section id="booking" className="max-w-3xl mx-auto px-4 py-16">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Book a Performance
              </h2>
              <p className="text-gray-600 mb-10">
                Fill out the form below to reserve your school&apos;s date.
                Bookings are confirmed immediately.
              </p>
              <BookingFormWrapper
                show={{
                  id: show.id,
                  title: show.title,
                  fullFeeAmount: show.fullFeeAmount,
                  enableFree: show.enableFree,
                  enablePwyw: show.enablePwyw,
                  enableFullFee: show.enableFullFee,
                }}
                availableDates={show.dates.map((d) => ({
                  id: d.id,
                  date: d.date.toISOString(),
                  timeSlot: d.timeSlot,
                  isBooked: d.isBooked,
                }))}
                customQuestions={show.customQuestions.map((q) => ({
                  id: q.id,
                  text: q.text,
                  type: q.type,
                  options: q.options,
                  isRequired: q.isRequired,
                }))}
              />
            </section>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-32 text-center px-4">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              School Tour
            </h1>
            <p className="text-gray-600 text-lg max-w-md">
              No performances are currently available for booking. Please check
              back soon or contact us at{" "}
              <a
                href="mailto:parbisi@americanstage.org"
                className="text-gold hover:underline"
              >
                parbisi@americanstage.org
              </a>
              .
            </p>
          </div>
        )}
      </main>
      <footer className="border-t border-navy-light py-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} American Stage. All rights reserved.
      </footer>
    </div>
  );
}
