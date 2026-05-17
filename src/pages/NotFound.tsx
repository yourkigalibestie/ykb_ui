import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Home } from 'lucide-react';




export function NotFound() {

  return (
    <main className="pt-16 bg-white text-gray-900">
      <section className="ykb-section bg-[#fdfbf7]">
        <div className="ykb-container">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-3xl border border-secondary/20 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                <Compass className="h-4 w-4" />
                Page not found
              </div>

              <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                <div>
                  <h1 className="text-3xl font-semibold text-primary md:text-4xl">
                    We could not find this page.
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-textSecondary">
                    The page you tried to open does not exist or was moved. Use one of the links below to continue.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                    >
                      <Home className="h-4 w-4" />
                      Go home
                    </Link>
                    <Link
                      to="/services"
                      className="inline-flex items-center gap-2 rounded-xl border border-primary px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                    >
                      View services
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}