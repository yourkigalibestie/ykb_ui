import { useTranslation } from 'react-i18next';

export function TermsOfService() {
  const { t } = useTranslation();

  return (
    <main className="pt-16 bg-white text-gray-900">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">
              {t('termsOfService.kicker')}
            </p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">{t('termsOfService.title')}</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
              {t('termsOfService.description')}
            </p>
          </div>
        </div>
      </section>

      <section className="ykb-section px-4 sm:px-6 lg:px-8">
        <div className="ykb-container">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('termsOfService.items.0.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('termsOfService.items.0.description')}</p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('termsOfService.items.1.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('termsOfService.items.1.description')}</p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('termsOfService.items.2.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('termsOfService.items.2.description')}</p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('termsOfService.items.3.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('termsOfService.items.3.description')}</p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('termsOfService.items.4.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('termsOfService.items.4.description')}</p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('termsOfService.items.5.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('termsOfService.items.5.description')}</p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('termsOfService.items.6.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('termsOfService.items.6.description')}</p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('termsOfService.items.7.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('termsOfService.items.7.description')}</p>
            </div>
          </div>

          <div className="mt-4 ykb-card">
            <h2 className="text-base font-semibold text-primary">{t('termsOfService.additional.0.title')}</h2>
            <p className="mt-2 text-sm text-textSecondary">{t('termsOfService.additional.0.description')}</p>
          </div>

          <div className="mt-4 ykb-card">
            <h2 className="text-base font-semibold text-primary">{t('termsOfService.additional.1.title')}</h2>
            <p className="mt-2 text-sm text-textSecondary">{t('termsOfService.additional.1.description')}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
