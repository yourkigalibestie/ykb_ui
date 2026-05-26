import { useNavigate } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AboutUs() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <main className="pt-16 bg-white text-primary">
      {/* Hero Section - Tagline Focus */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary via-primary/95 to-primary py-16 sm:py-24 lg:py-32">
        <div className="ykb-container">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-secondary">
              {t('aboutUs.hero.kicker')}
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text5xl lg:text-6xl">
              {t('aboutUs.hero.titlePrefix')} <span className="text-secondary">{t('aboutUs.hero.titleEmphasis')}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-200">{t('aboutUs.hero.description')}</p>
          </div>
        </div>
      </section>

      {/* The Origin Story - Narrative Section */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="ykb-container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left - Emotional narrative with varied sizing */}
            <div className="space-y-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-secondary">{t('aboutUs.origin.kicker')}</p>
                <h2 className="mt-2 text-4xl font-bold text-primary">{t('aboutUs.origin.title')}</h2>
              </div>

              <div className="space-y-6 text-base leading-relaxed text-textSecondary">
                <p className="text-lg font-medium italic text-primary">“{t('aboutUs.origin.quote')}”</p>

                <p>{t('aboutUs.origin.p1')}</p>

                <p className="font-semibold text-primary">{t('aboutUs.origin.p2')}</p>

                <p>{t('aboutUs.origin.p3')}</p>

                <p className="border-l-4 border-secondary bg-secondary/5 py-4 pl-4 text-primary">{t('aboutUs.origin.p4')}</p>
              </div>
            </div>

            {/* Right - Insight & Realization */}
            <div className="flex flex-col justify-center space-y-8">
              <div className="ykb-card border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent py-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/20">
                  <Lightbulb className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-primary">{t('aboutUs.spark.title')}</h3>
                <p className="mt-3 text-base text-textSecondary">
                  {t('aboutUs.spark.questionPrefix')}{' '}
                  <span className="font-semibold">{t('aboutUs.spark.questionEmphasis')}</span>
                </p>
              </div>

              <div className="space-y-4 border-l-4 border-gold pl-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-gold">{t('aboutUs.reality.kicker')}</p>
                <p className="text-base leading-relaxed text-textSecondary">{t('aboutUs.reality.p1')}</p>
                <p className="text-base leading-relaxed text-textSecondary">{t('aboutUs.reality.p2')}</p>
              </div>

              <div className="rounded-xl bg-primary/5 p-6 text-center">
                <p className="text-sm uppercase tracking-widest text-secondary">{t('aboutUs.questionKicker')}</p>
                <h4 className="mt-2 text-2xl font-bold text-primary">{t('aboutUs.questionTitle')}</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision - Editorial Layout */}
      <section className="relative overflow-hidden bg-surface px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="ykb-container">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">{t('aboutUs.foundation.kicker')}</p>
              <h2 className="mt-2 text-3xl font-bold text-primary sm:text-4xl">{t('aboutUs.foundation.title')}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <article className="relative h-full overflow-hidden rounded-[1.75rem] border border-secondary/20 bg-white p-5 shadow-soft sm:p-7">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-secondary/10 blur-2xl" />
                <div className="relative flex h-full flex-col justify-between gap-6">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary">{t('aboutUs.mission.kicker')}</p>
                    <h3 className="mt-3 text-3xl font-bold text-primary sm:text-4xl">{t('aboutUs.mission.title')}</h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl p-4">
                      <p className="text-sm font-semibold uppercase tracking-widest text-primary/70">{t('aboutUs.mission.whatWeDo.kicker')}</p>
                      <p className="mt-3 text-base leading-relaxed text-textSecondary">{t('aboutUs.mission.whatWeDo.p')}</p>
                    </div>

                    <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
                      <p className="text-sm font-semibold uppercase tracking-widest text-gold">{t('aboutUs.mission.howItFeels.kicker')}</p>
                      <p className="mt-3 text-base leading-relaxed text-textSecondary">{t('aboutUs.mission.howItFeels.p')}</p>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div className="lg:col-span-5">
              <article className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-primary p-5 text-white shadow-card sm:p-7">
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary">{t('aboutUs.vision.kicker')}</p>
                  <h3 className="mt-3 max-w-md text-3xl font-bold leading-tight text-white sm:text-4xl">{t('aboutUs.vision.title')}</h3>
                  <p className="mt-5 max-w-md text-base leading-relaxed text-white/85">{t('aboutUs.vision.p')}</p>

                  <div className="mt-6 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">{t('aboutUs.vision.ease.kicker')}</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/90">{t('aboutUs.vision.ease.p')}</p>
                    </div>
                    <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">{t('aboutUs.vision.trust.kicker')}</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/90">{t('aboutUs.vision.trust.p')}</p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* What We Believe - Values Grid */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="ykb-container">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary">{t('aboutUs.beliefs.kicker')}</p>
            <h2 className="mt-2 text-4xl font-bold text-primary">{t('aboutUs.beliefs.title')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: t('aboutUs.beliefs.items.0.title'), description: t('aboutUs.beliefs.items.0.description') },
              { title: t('aboutUs.beliefs.items.1.title'), description: t('aboutUs.beliefs.items.1.description') },
              { title: t('aboutUs.beliefs.items.2.title'), description: t('aboutUs.beliefs.items.2.description') },
              { title: t('aboutUs.beliefs.items.3.title'), description: t('aboutUs.beliefs.items.3.description') },
            ].map((belief, index) => (
              <div
                key={index}
                className="group relative rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 p-6 transition-all duration-300 hover:shadow-soft"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-20" />
                <div className="relative">
                  <h3 className="text-lg font-bold text-primary">{belief.title}</h3>
                  <p className="mt-3 text-sm text-textSecondary">{belief.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Sets Us Apart - Text First */}
      <section className="relative overflow-hidden bg-primary px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="ykb-container relative z-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">{t('aboutUs.apart.kicker')}</p>
              <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{t('aboutUs.apart.title')}</h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">{t('aboutUs.apart.p')}</p>
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
                    className={`group relative overflow-hidden rounded-[1.5rem] border border-white/10 p-5 shadow-soft transition-transform duration-300 hover:-translate-y-1 ${
                      index === 1 ? 'bg-white text-primary' : 'bg-white/10 text-white backdrop-blur-sm'
                    }`}
                  >
                    <div
                      className={`mb-8 flex items-center justify-between border-b pb-4 ${
                        index === 1 ? 'border-primary/10' : 'border-white/15'
                      }`}
                    >
                      <span className="text-sm font-semibold tracking-[0.28em] text-secondary">{feature.label}</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${index === 1 ? 'bg-secondary' : 'bg-secondary/90'}`} />
                    </div>
                    <h3 className={`text-2xl font-bold leading-tight ${index === 1 ? 'text-primary' : 'text-white'}`}>
                      {feature.title}
                    </h3>
                    <p className={`mt-4 text-sm leading-relaxed ${index === 1 ? 'text-textSecondary' : 'text-white/80'}`}>
                      {feature.description}
                    </p>
                    <div
                      className={`mt-6 h-px w-full bg-gradient-to-r ${
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
      <section className="bg-surface px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="ykb-container text-center">
          <h2 className="max-w-2xl text-3xl font-bold text-primary sm:text-4xl">{t('aboutUs.cta.title')}</h2>
          <p className="mt-4 max-w-xl text-base text-textSecondary mx-auto">{t('aboutUs.cta.p')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-soft"
            >
              {t('aboutUs.cta.primaryButton')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/register?role=serviceProvider')}
              className="rounded-lg border-2 border-primary bg-white px-8 py-3 font-semibold text-primary transition-all hover:bg-primary/5"
            >
              {t('aboutUs.cta.secondaryButton')}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
