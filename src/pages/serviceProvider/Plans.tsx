import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { getBackendSession } from '../../utils/backendAuth';
import { Link } from 'react-router-dom';

interface Plan {
	name: string;
	price: string;
	description: string;
	features: string[];
	popular?: boolean;
	actionLabel: string;
	actionDisabled?: boolean;
}

export function ServiceProviderPlans() {
	const { t } = useTranslation();
	const session = getBackendSession();
	const accessToken = session?.accessToken;
	const userRole = session?.user?.role;

	const plans: Plan[] = [
		{
			name: 'Basic',
			price: 'Free',
			description: 'Perfect for starting out',
			actionLabel: t('provider.currentPlan'),
			actionDisabled: true,
			features: [
				t('provider.upto5Services'),
				t('provider.basicProfile'),
				t('provider.emailSupport'),
				t('provider.monthlyReports'),
			],
		},
		{
			name: 'Professional',
			price: 'RWF 999',
			description: 'For growing businesses',
			popular: true,
			actionLabel: t('provider.upgradePlan'),
			features: [
				t('provider.unlimitedServices'),
				t('provider.advancedProfile'),
				t('provider.prioritySupport'),
				t('provider.analyticsTools'),
				t('provider.customBranding'),
				t('provider.apiAccess'),
			],
		},
		{
			name: 'Enterprise',
			price: 'Custom',
			description: 'For large operations',
			actionLabel: t('provider.contactUs'),
			features: [
				t('provider.allFeatures'),
				t('provider.dedicatedManager'),
				t('provider.whiteLabel'),
				t('provider.advancedAnalytics'),
				t('provider.sso'),
				t('provider.customIntegration'),
				t('provider.sla'),
			],
		},
	];

	if (!accessToken) {
		return (
			<main className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pt-24">
				<div className="ykb-container">
					<div className="ykb-card">
						<div className="ykb-alert ykb-alert-info">{t('provider.pleaseLogin')}</div>
						<div className="mt-4">
							<Link to="/login" className="ykb-button-primary">{t('provider.goToLogin')}</Link>
						</div>
					</div>
				</div>
			</main>
		);
	}

	if (userRole && userRole !== 'PROVIDER') {
		return (
			<main className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pt-24">
				<div className="ykb-container">
					<div className="ykb-card">
						<div className="ykb-alert ykb-alert-warning">
							{t('provider.providerOnly')}
						</div>
						<div className="mt-4">
							<Link to="/profile" className="ykb-button-outline">{t('provider.goToProfile')}</Link>
						</div>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pt-24">
			<div className="ykb-container">
				<header className="mb-8 text-center">
					<h1 className="text-4xl font-bold text-primary">{t('provider.plans')}</h1>
					<p className="mt-2 text-lg text-textSecondary">{t('provider.choosePlanDescription')}</p>
				</header>

				<div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-10">
					{plans.map((plan) => (
						<div
							key={plan.name}
							className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
								plan.popular
									? 'border-primary/50 bg-white shadow-xl ring-2 ring-primary/20'
									: 'border-border bg-white shadow-md hover:shadow-lg'
							}`}
						>
							{plan.popular && (
								<div className="absolute inset-x-0 top-0 bg-linear-to-r from-primary/10 to-secondary/10 px-4 py-2 text-center">
									<div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
										{t('provider.mostPopular')}
									</div>
								</div>
							)}

							<div className={plan.popular ? 'mt-12 px-6 pb-6 pt-6' : 'px-6 py-8'}>
								<h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
								<p className="mt-2 text-sm text-textSecondary">{plan.description}</p>

								<div className="mt-6 flex items-baseline">
									<span className="text-5xl font-bold text-primary">{plan.price}</span>
									{plan.price !== 'Free' && plan.price !== 'Custom' && (
										<span className="ml-2 text-textSecondary">/month</span>
									)}
								</div>

								<button
									disabled={plan.actionDisabled}
									className={`mt-8 w-full rounded-lg py-3 px-4 font-semibold transition-all duration-200 ${
										plan.popular
											? 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
											: plan.actionDisabled
											? 'bg-secondary/20 text-secondary disabled:opacity-50'
											: 'border-2 border-primary text-primary hover:bg-primary/5'
									}`}
								>
									{plan.actionLabel}
								</button>

								<div className="mt-8 space-y-4 border-t border-border pt-8">
									<p className="text-sm font-semibold text-gray-900">{t('provider.whatsIncluded')}</p>
									{plan.features.map((feature, idx) => (
										<div key={idx} className="flex items-start gap-3">
											<Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
											<span className="text-sm text-textSecondary">{feature}</span>
										</div>
									))}
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="mt-16 rounded-2xl border-2 border-primary/20 bg-primary/5 px-8 py-8 text-center">
					<h2 className="text-2xl font-bold text-primary">{t('provider.needCustomPlan')}</h2>
					<p className="mt-2 text-textSecondary">{t('provider.contactSalesTeam')}</p>
					<button className="mt-6 rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90">
						{t('provider.contactSales')}
					</button>
				</div>
			</div>
		</main>
	);
}
