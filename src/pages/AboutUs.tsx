import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function AboutUs() {
  const navigate = useNavigate();
  const { t } = useTranslation();

    useEffect(() => {
      if (typeof window === 'undefined') return;
  
      const existingScript = document.querySelector('script[src="https://www.googletagmanager.com/gtag/js?id=G-5T7DTFNYP6"]');
      if (existingScript) return;
  
      const externalScript = document.createElement('script');
      externalScript.async = true;
      externalScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-5T7DTFNYP6';
      document.head.appendChild(externalScript);
  
      const inlineScript = document.createElement('script');
      inlineScript.text = `window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-5T7DTFNYP6');`;
      document.head.appendChild(inlineScript);
  
      return () => {
        document.head.removeChild(externalScript);
        document.head.removeChild(inlineScript);
      };
    }, []);

  return (
    <main className="pt-16 bg-white text-primary">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary via-primary/95 to-primary py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl">
            <div className="h-px w-8 bg-secondary mb-4"></div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
              {t('aboutUs.hero.kicker')}
            </p>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {t('aboutUs.hero.titlePrefix')} <span className="text-secondary">{t('aboutUs.hero.titleEmphasis')}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-200">{t('aboutUs.hero.description')}</p>
          </div>
        </div>
      </section>

      {/* The Origin Story */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left side */}
            <div className="space-y-6">
              <div>
                <div className="h-px w-8 bg-secondary mb-3"></div>
                <p className="text-xs font-semibold uppercase tracking-widest text-secondary">{t('aboutUs.origin.kicker')}</p>
                <h2 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">{t('aboutUs.origin.title')}</h2>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-textSecondary">
                <p className="text-base font-medium italic text-primary">“{t('aboutUs.origin.quote')}”</p>

                <p>{t('aboutUs.origin.p1')}</p>

                <p className="font-semibold text-primary">{t('aboutUs.origin.p2')}</p>

                <p>{t('aboutUs.origin.p3')}</p>

                <p className="border-l-4 border-secondary bg-secondary/5 py-3 pl-4 text-primary text-sm">{t('aboutUs.origin.p4')}</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex flex-col justify-center space-y-6">
              <div className="border border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent p-6">
                <div className="mb-3">
                  <div className="h-px w-8 bg-secondary"></div>
                </div>
                <h3 className="text-lg font-bold text-primary">{t('aboutUs.spark.title')}</h3>
                <p className="mt-2 text-sm text-textSecondary leading-relaxed">
                  {t('aboutUs.spark.questionPrefix')}{' '}
                  <span className="font-semibold">{t('aboutUs.spark.questionEmphasis')}</span>
                </p>
              </div>

              <div className="border-l-4 border-secondary pl-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-secondary">{t('aboutUs.reality.kicker')}</p>
                <p className="text-sm leading-relaxed text-textSecondary">{t('aboutUs.reality.p1')}</p>
                <p className="text-sm leading-relaxed text-textSecondary">{t('aboutUs.reality.p2')}</p>
              </div>

              <div className="bg-primary/5 p-5 text-center">
                <p className="text-xs uppercase tracking-widest text-secondary">{t('aboutUs.questionKicker')}</p>
                <h4 className="mt-2 text-xl font-bold text-primary">{t('aboutUs.questionTitle')}</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="relative overflow-hidden bg-[#fdfbf7] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <div className="h-px w-8 bg-secondary mb-3"></div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">{t('aboutUs.foundation.kicker')}</p>
            <h2 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">{t('aboutUs.foundation.title')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-7">
              <article className="relative h-full overflow-hidden border border-secondary/20 bg-white p-5 shadow-sm sm:p-6">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-secondary/10 blur-2xl" />
                <div className="relative flex h-full flex-col justify-between gap-5">
                  <div className="max-w-2xl">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-secondary">{t('aboutUs.mission.kicker')}</p>
                    <h3 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">{t('aboutUs.mission.title')}</h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">{t('aboutUs.mission.whatWeDo.kicker')}</p>
                      <p className="mt-2 text-sm leading-relaxed text-textSecondary">{t('aboutUs.mission.whatWeDo.p')}</p>
                    </div>

                    <div className="border border-secondary/20 bg-secondary/5 p-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-secondary">{t('aboutUs.mission.howItFeels.kicker')}</p>
                      <p className="mt-2 text-sm leading-relaxed text-textSecondary">{t('aboutUs.mission.howItFeels.p')}</p>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div className="lg:col-span-5">
              <article className="relative overflow-hidden border border-white/10 bg-primary p-5 shadow-card sm:p-6">
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
                <div className="relative">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-secondary">{t('aboutUs.vision.kicker')}</p>
                  <h3 className="mt-2 max-w-md text-2xl font-bold leading-tight text-white sm:text-3xl">{t('aboutUs.vision.title')}</h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">{t('aboutUs.vision.p')}</p>

                  <div className="mt-5 grid gap-3 border-t border-white/15 pt-4 sm:grid-cols-2">
                    <div className="bg-white/12 p-3 backdrop-blur-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-secondary">{t('aboutUs.vision.ease.kicker')}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/90">{t('aboutUs.vision.ease.p')}</p>
                    </div>
                    <div className="bg-white/12 p-3 backdrop-blur-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-secondary">{t('aboutUs.vision.trust.kicker')}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/90">{t('aboutUs.vision.trust.p')}</p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* What We Believe - Values Grid */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 max-w-2xl">
            <div className="h-px w-8 bg-secondary mb-3"></div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">{t('aboutUs.beliefs.kicker')}</p>
            <h2 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">{t('aboutUs.beliefs.title')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: t('aboutUs.beliefs.items.0.title'), description: t('aboutUs.beliefs.items.0.description') },
              { title: t('aboutUs.beliefs.items.1.title'), description: t('aboutUs.beliefs.items.1.description') },
              { title: t('aboutUs.beliefs.items.2.title'), description: t('aboutUs.beliefs.items.2.description') },
              { title: t('aboutUs.beliefs.items.3.title'), description: t('aboutUs.beliefs.items.3.description') },
            ].map((belief, index) => (
              <div
                key={index}
                className="group relative border border-secondary/25 bg-gradient-to-br from-primary/5 to-secondary/5 p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary to-secondary/50 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-10" />
                <div className="relative">
                  <div className="h-px w-6 bg-secondary mb-3"></div>
                  <h3 className="text-base font-bold text-primary">{belief.title}</h3>
                  <p className="mt-2 text-xs text-textSecondary leading-relaxed">{belief.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section className="relative overflow-hidden bg-primary py-10">
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-4">
              <div className="h-px w-8 bg-secondary mb-3"></div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">{t('aboutUs.apart.kicker')}</p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{t('aboutUs.apart.title')}</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">{t('aboutUs.apart.p')}</p>
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  {
                    label: '01',
                    title: t('aboutUs.apart.features.0.title'),
                    description: t('aboutUs.apart.features.0.description'),
                  },
                  {
                    label: '02',
                    title: t('aboutUs.apart.features.1.title'),
                    description: t('aboutUs.apart.features.1.description'),
                  },
                  {
                    label: '03',
                    title: t('aboutUs.apart.features.2.title'),
                    description: t('aboutUs.apart.features.2.description'),
                  },
                ].map((feature, index) => (
                  <article
                    key={index}
                    className={`group relative overflow-hidden border border-white/10 p-5 transition-all duration-300 hover:-translate-y-1 ${
                      index === 1 ? 'bg-white text-primary' : 'bg-white/10 text-white backdrop-blur-sm'
                    }`}
                  >
                    <div
                      className={`mb-6 flex items-center justify-between border-b pb-3 ${
                        index === 1 ? 'border-primary/10' : 'border-white/15'
                      }`}
                    >
                      <span className="text-xs font-semibold tracking-[0.28em] text-secondary">{feature.label}</span>
                      <div className={`h-1.5 w-1.5 rounded-full ${index === 1 ? 'bg-secondary' : 'bg-secondary/90'}`} />
                    </div>
                    <h3 className={`text-xl font-bold leading-tight ${index === 1 ? 'text-primary' : 'text-white'}`}>
                      {feature.title}
                    </h3>
                    <p className={`mt-3 text-xs leading-relaxed ${index === 1 ? 'text-textSecondary' : 'text-white/80'}`}>
                      {feature.description}
                    </p>
                    <div
                      className={`mt-5 h-px w-full bg-gradient-to-r ${
                        index === 1 ? 'from-transparent via-secondary/60 to-transparent' : 'from-transparent via-white/20 to-transparent'
                      }`}
                    />
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#fdfbf7] py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="h-px w-8 bg-secondary mb-4 mx-auto"></div>
          <h2 className="max-w-2xl text-2xl font-bold text-primary sm:text-3xl mx-auto">{t('aboutUs.cta.title')}</h2>
          <p className="mt-3 max-w-xl text-sm text-textSecondary mx-auto">{t('aboutUs.cta.p')}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="border border-primary bg-primary px-6 py-2.5 font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-md text-sm"
            >
              {t('aboutUs.cta.primaryButton')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/register?role=serviceProvider')}
              className="border-2 border-primary bg-white px-6 py-2.5 font-semibold text-primary transition-all hover:bg-primary/5 text-sm"
            >
              {t('aboutUs.cta.secondaryButton')}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}