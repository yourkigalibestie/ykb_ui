import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function ProviderTab(props: { to: string; label: string; isLast: boolean }) {
	const { to, label, isLast } = props;
	return (
		<NavLink
			to={to}
			end={to === '/provider'}
			className={({ isActive }) =>
				[
					'relative flex h-10 items-center px-3 text-sm font-semibold transition-colors duration-200',
					isActive ? 'bg-secondary text-white' : 'text-textSecondary hover:bg-surface/60 hover:text-primary',
					isLast ? '' : 'after:absolute after:right-0 after:top-2 after:bottom-2 after:w-px after:bg-border',
				].join(' ')
			}
		>
			{label}
		</NavLink>
	);
}

export function ProviderLayout() {
	const { t } = useTranslation();

	const navItems: Array<{ to: string; label: string }> = [
		{ to: '/provider', label: t('provider.overview') },
		{ to: '/provider/services', label: t('provider.services') },
		{ to: '/provider/requests', label: t('provider.requests') },
		{ to: '/provider/profile', label: t('provider.profile') },
	];

	return (
		<div className="relative">
			<div className="ykb-container">
				<div className="pt-24">
					<div className="mb-4 flex items-center justify-between gap-3">
						<div className="text-sm font-bold text-primary">{t('provider.dashboard')}</div>
						<nav className="max-w-full overflow-x-auto">
							<div className="flex items-stretch whitespace-nowrap">
								{navItems.map((item, index) => (
									<ProviderTab
										key={item.to}
										to={item.to}
										label={item.label}
										isLast={index === navItems.length - 1}
									/>
								))}
							</div>
						</nav>
					</div>

					<div className="-mt-16">
						<Outlet />
					</div>
				</div>
			</div>
		</div>
	);
}

