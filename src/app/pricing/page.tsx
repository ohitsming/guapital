'use client'

import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon as XMarkIconOutline } from '@heroicons/react/24/outline'
import { CheckIcon, XMarkIcon as XMarkIconMini } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { Logo } from '@/components/Logo'

const navigation = [
	{ name: 'About', href: '/about' },
	{ name: 'Pricing', href: '/pricing' },
	{ name: 'Contact', href: '/contact' },
]

const pricing = {
	tiers: [
		{
			id: 'free',
			name: 'Free',
			description: 'For individuals to try out the core AI survey generation features.',
			price: { monthly: '$0', annually: '$0' },
			highlights: ['Unlimited Surveys', '50 Responses per Survey', 'Basic Analytics', '500 AI Credits/month'],
			featured: false,
			href: '/signup',
		},
		{
			id: 'pro',
			name: 'Pro',
			description: 'For professionals who need to analyze feedback and make decisions.',
			price: { monthly: '$19', annually: '$190' },
			highlights: [
				'2,500 Responses per Survey',
				'AI-Powered Analysis',
				'Data Export (CSV)',
				'Custom Branding',
				'10,000 AI Credits/month',
			],
			featured: true,
			href: '/signup',
		},
		{
			id: 'business',
			name: 'Business',
			description: 'For teams that need to collaborate and integrate feedback into their workflows.',
			price: { monthly: '$49', annually: '$490' },
			highlights: [
				'10,000 Responses per Survey',
				'Team Collaboration',
				'Slack & Sheets Integrations',
				'50,000 AI Credits/month',
			],
			featured: false,
			href: '/contact',
		},
	],
	sections: [
		{
			name: 'Core Features',
			features: [
				{ name: 'Surveys', tiers: { Free: 'Unlimited', Pro: 'Unlimited', Business: 'Unlimited' } },
				{ name: 'Questions per Survey', tiers: { Free: '10', Pro: 'Unlimited', Business: 'Unlimited' } },
				{ name: 'Responses per Survey', tiers: { Free: '50', Pro: '2,500', Business: '10,000' } },
			],
		},
		{
			name: 'AI Features',
			features: [
				{ name: 'AI Survey Generation', tiers: { Free: true, Pro: true, Business: true } },
				{ name: 'AI-Powered Analysis', tiers: { Free: false, Pro: 'Coming soon', Business: 'Coming soon' } },
				{ name: 'AI Credits per month', tiers: { Free: '500', Pro: '10,000', Business: '50,000' } },
			],
		},
		{
			name: 'Analytics & Reporting',
			features: [
				{ name: 'Basic Analytics', tiers: { Free: true, Pro: true, Business: true } },
				{ name: 'Advanced Analytics', tiers: { Free: false, Pro: 'Coming soon', Business: 'Coming soon' } },
				{ name: 'Data Exports (CSV)', tiers: { Free: false, Pro: 'Coming soon', Business: 'Coming soon' } },
			],
		},
		{
			name: 'Support & Customization',
			features: [
				{ name: 'Custom Branding', tiers: { Free: false, Pro: 'Coming soon', Business: 'Coming soon' } },
				{ name: 'Priority Support', tiers: { Free: false, Pro: 'Coming soon', Business: 'Coming soon' } },
				{ name: 'Team Collaboration', tiers: { Free: false, Pro: false, Business: 'Coming soon' } },
				{ name: 'Integrations (Slack, Sheets)', tiers: { Free: false, Pro: false, Business: 'Coming soon' } },
			],
		},
	],
}

const faqs = [
	{
		id: 1,
		question: 'Can I try Guapital before I buy?',
		answer: 'Absolutely. Our Free plan is not a time-limited trial. It includes core features and allows you to track your net worth, so you can see the value for yourself. You can use it for as long as you like within the plan\'s limits.',
	},
	{
		id: 2,
		question: 'What are AI Credits and how are they used?',
		answer: 'AI Credits power our artificial intelligence features. You\'ll use them when generating surveys with our AI. Our upcoming AI Analysis tools on the Pro and Business plans will also use credits. Each plan includes a generous monthly amount, and you can track your usage in your dashboard.',
	},
	{
		id: 3,
		question: 'What happens if I need more responses or features?',
		answer: 'You can upgrade your plan at any time from your account settings. If you\'re on the Free plan and hit your response limit, your survey will pause collecting new responses until you upgrade to Pro. Upgrading unlocks higher limits and powerful features like AI-Powered Analysis (coming soon).',
	},
	{
		id: 4,
		question: 'Can I change or cancel my plan at any time?',
		answer: 'Yes. You have complete control over your subscription. You can upgrade, downgrade, or cancel your plan at any time through your account dashboard. Changes will be reflected at the start of your next billing cycle.',
	},
]

const footerNavigation = {
	company: [
		{ name: 'About', href: '/about' },
		{ name: 'Contact', href: '/contact' },
	],
	legal: [
		{ name: 'Terms of Service', href: '/terms' },
		{ name: 'Privacy Policy', href: '/privacy' },
	],
}

function classNames(...classes: any) {
	return classes.filter(Boolean).join(' ')
}

export default function PricingPage() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [frequency, setFrequency] = useState('monthly')

	return (
		<div>
			<main>
				{/* Pricing section */}
				<form className="group/tiers isolate overflow-hidden">
					<div className="flow-root border-b border-b-transparent pb-16 pt-24 sm:pt-32 lg:pb-0 ">
						<div className="mx-auto max-w-7xl px-6 lg:px-8">
							<div className="relative z-10">
								<h2 className="mx-auto max-w-4xl text-balance text-center text-5xl font-semibold tracking-tight text-[#E27A70] sm:text-6xl">
									Pricing that grows with you
								</h2>
								<p className="mx-auto mt-6 max-w-2xl text-pretty text-center text-lg font-medium text-neutral-500 sm:text-xl/8">
									From quick feedback to in-depth market research, we have a plan that fits your needs. Start for free and upgrade as you grow.
								</p>

								{/* monthly / annually toggle */}
								{/* <div className="mt-16 flex justify-center">
									<fieldset aria-label="Payment frequency">
										<div className="grid grid-cols-2 gap-x-1 rounded-full bg-white/5 p-1 text-center text-xs/5 font-semibold text-white">
											
											<label className="group relative rounded-full px-2.5 py-1 has-[:checked]:bg-indigo-500">
												<input
													value="monthly"
													checked={frequency === 'monthly'}
													onChange={() => setFrequency('monthly')}
													name="frequency"
													type="radio"
													className="peer absolute inset-0 appearance-none rounded-full"
												/>
												<span className="text-white">Monthly</span>
											</label>
											<label className="group relative rounded-full px-2.5 py-1 has-[:checked]:bg-indigo-500">
												<input
													value="annually"
													checked={frequency === 'annually'}
													onChange={() => setFrequency('annually')}
													name="frequency"
													type="radio"
													className="peer absolute inset-0 appearance-none rounded-full"
												/>
												<span className="text-white">Annually</span>
											</label>
										</div>
									</fieldset>
								</div> */}
							</div>
							<div className="relative mx-auto mt-15 grid max-w-md grid-cols-1 gap-y-8 lg:mx-0 lg:-mb-14 lg:max-w-none lg:grid-cols-3">
								<div
									aria-hidden="true"
									className="hidden lg:absolute lg:inset-x-px lg:bottom-0 lg:top-4 lg:block lg:rounded-t-2xl lg:bg-gray-800/80 lg:ring-1 lg:ring-white/10"
								/>
								{pricing.tiers.map((tier) => (
									<div
										key={tier.id}
										data-featured={tier.featured ? 'true' : undefined}
										className={classNames(
											tier.featured
												? 'z-10 bg-white shadow-xl outline outline-1 outline-gray-900/10 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10'
												: 'bg-gray-800/80 text-white outline outline-1 -outline-offset-1 outline-white/10 lg:bg-transparent lg:pb-14 lg:outline-0',
											'group/tier relative rounded-2xl',
										)}
									>
										<div className="p-8 lg:pt-12 xl:p-10 xl:pt-14">
											<h3
												id={`tier-${tier.id}`}
												className="text-sm/6 font-semibold text-white group-data-[featured]/tier:text-gray-900 dark:group-data-[featured]/tier:text-white"
											>
												{tier.name}
											</h3>
											<div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-stretch">
												<div className="mt-2 flex items-center gap-x-4">
													<p className="text-4xl font-semibold tracking-tight text-white group-data-[featured]/tier:text-gray-900 dark:group-data-[featured]/tier:text-white">
														{frequency === 'monthly' ? tier.price.monthly : tier.price.annually}
													</p>
													<div className="text-sm">
														<p className="text-white group-data-[featured]/tier:text-gray-900 dark:group-data-[featured]/tier:text-white">
															USD
														</p>
														<p className="text-gray-400 group-data-[featured]/tier:text-gray-500 dark:group-data-[featured]/tier:text-gray-400">
															Billed {frequency === 'monthly' ? 'monthly' : 'annually'}
														</p>
													</div>
												</div>												
													<Link
													href={tier.href}
													aria-describedby={`tier-${tier.id}`}
													className={classNames(
														'w-full rounded-md bg-white/10 px-3 py-2 text-center text-sm/6 font-semibold hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/75',
														tier.featured && 'bg-indigo-600 shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500',
														!tier.featured && 'ring-1 ring-inset ring-white/5'
													)}
												>
													{tier.id === 'business' ? 'Contact Us' : 'Get Started'}
												</Link>
											</div>
											<div className="mt-8 flow-root sm:mt-10">
												<ul
													role="list"
													className="-my-2 divide-y divide-white/5 border-t border-white/5 text-sm/6 text-white group-data-[featured]/tier:divide-gray-900/5 group-data-[featured]/tier:border-gray-900/5 group-data-[featured]/tier:text-gray-600 lg:border-t-0 dark:group-data-[featured]/tier:divide-white/10 dark:group-data-[featured]/tier:border-white/10 dark:group-data-[featured]/tier:text-white"
												>
													{tier.highlights.map((mainFeature) => (
														<li key={mainFeature} className="flex gap-x-3 py-2">
															<CheckIcon
																aria-hidden="true"
																className="h-6 w-5 flex-none text-gray-500 group-data-[featured]/tier:text-indigo-600 dark:group-data-[featured]/tier:text-indigo-400"
															/>
															{mainFeature}
														</li>
													))}
												</ul>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
					<div className="relative bg-gray-50 lg:pt-14 dark:bg-gray-900">
						<div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
							{/* Feature comparison (up to lg) */}
							<section aria-labelledby="mobile-comparison-heading" className="lg:hidden">
								<h2 id="mobile-comparison-heading" className="sr-only">
									Feature comparison
								</h2>

								<div className="mx-auto max-w-2xl space-y-16">
									{pricing.tiers.map((tier) => (
										<div key={tier.id} className="border-t border-gray-900/10 dark:border-white/10">
											<div
												className={classNames(
													tier.featured ? 'border-indigo-600 dark:border-indigo-500' : 'border-transparent',
													'-mt-px w-72 border-t-2 pt-10 md:w-80',
												)}
											>
												<h3
													className={classNames(
														tier.featured ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white',
														'text-sm/6 font-semibold',
													)}
												>
													{tier.name}
												</h3>
												<p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">{tier.description}</p>
											</div>

											<div className="mt-10 space-y-10">
												{pricing.sections.map((section) => (
													<div key={section.name}>
														<h4 className="text-sm/6 font-semibold text-gray-900 dark:text-white">{section.name}</h4>
														<div className="relative mt-6">
															{/* Fake card background */}
															<div
																aria-hidden="true"
																className="absolute inset-y-0 right-0 hidden w-1/2 rounded-lg bg-white shadow-sm sm:block dark:bg-gray-800/50 dark:shadow-none"
															/>

															<div
																className={classNames(
																	tier.featured
																		? 'ring-2 ring-indigo-600 dark:ring-indigo-500'
																		: 'ring-1 ring-gray-900/10 dark:ring-white/10',
																	'relative rounded-lg bg-white shadow-sm sm:rounded-none sm:bg-transparent sm:shadow-none sm:ring-0 dark:bg-gray-800/50 dark:shadow-none dark:sm:bg-transparent',
																)}
															>
																<dl className="divide-y divide-gray-200 text-sm/6 dark:divide-white/10">
																	{section.features.map((feature: any) => (
																		<div
																			key={feature.name}
																			className="flex items-center justify-between px-4 py-3 sm:grid sm:grid-cols-2 sm:px-0"
																		>
																			<dt className="pr-4 text-gray-600 dark:text-gray-400">{feature.name}</dt>
																			<dd className="flex items-center justify-end sm:justify-center sm:px-4">
																				{typeof feature.tiers[tier.name] === 'string' ? (
																					<span
																						className={
																							tier.featured
																								? 'font-semibold text-indigo-600 dark:text-indigo-400'
																								: 'text-gray-900 dark:text-white'
																						}
																					>
																						{feature.tiers[tier.name]}
																					</span>
																				) : (
																					<>
																						{feature.tiers[tier.name] === true ? (
																							<CheckIcon
																								aria-hidden="true"
																								className="mx-auto size-5 text-indigo-600 dark:text-indigo-400"
																							/>
																						) : (
																							<XMarkIconMini
																								aria-hidden="true"
																								className="mx-auto size-5 text-gray-400 dark:text-gray-600"
																							/>
																						)}

																						<span className="sr-only">
																							{feature.tiers[tier.name] === true ? 'Yes' : 'No'}
																						</span>
																					</>
																				)}
																			</dd>
																		</div>
																	))}
																</dl>
															</div>

															{/* Fake card border */}
															<div
																aria-hidden="true"
																className={classNames(
																	tier.featured
																		? 'ring-2 ring-indigo-600 dark:ring-indigo-500'
																		: 'ring-1 ring-gray-900/10 dark:ring-white/10',
																	'pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 rounded-lg sm:block',
																)}
															/>
														</div>
													</div>
												))}
											</div>
										</div>
									))}
								</div>
							</section>

							{/* Feature comparison (lg+) */}
							<section aria-labelledby="comparison-heading" className="hidden lg:block">
								<h2 id="comparison-heading" className="sr-only">
									Feature comparison
								</h2>

								<div className="grid grid-cols-4 gap-x-8 border-t border-gray-900/10 before:block dark:border-white/10">
									{pricing.tiers.map((tier) => (
										<div key={tier.id} aria-hidden="true" className="-mt-px">
											<div
												className={classNames(
													tier.featured ? 'border-indigo-600 dark:border-indigo-500' : 'border-transparent',
													'border-t-2 pt-10',
												)}
											>
												<p
													className={classNames(
														tier.featured ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white',
														'text-sm/6 font-semibold',
													)}
												>
													{tier.name}
												</p>
												<p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">{tier.description}</p>
											</div>
										</div>
									))}
								</div>

								<div className="-mt-6 space-y-16">
									{pricing.sections.map((section) => (
										<div key={section.name}>
											<h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">{section.name}</h3>
											<div className="relative -mx-8 mt-10">
												{/* Fake card backgrounds */}
												<div
													aria-hidden="true"
													className="absolute inset-x-8 inset-y-0 grid grid-cols-4 gap-x-8 before:block"
												>
													<div className="size-full rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none" />
													<div className="size-full rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none" />
													<div className="size-full rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none" />
												</div>

												<table className="relative w-full border-separate border-spacing-x-8">
													<thead>
														<tr className="text-left">
															<th scope="col">
																<span className="sr-only">Feature</span>
															</th>
															{pricing.tiers.map((tier) => (
																<th key={tier.id} scope="col">
																	<span className="sr-only">{tier.name} tier</span>
																</th>
															))}
														</tr>
													</thead>
													<tbody>
														{section.features.map((feature: any, featureIdx: any) => (
															<tr key={feature.name}>
																<th
																	scope="row"
																	className="w-1/4 py-3 pr-4 text-left text-sm/6 font-normal text-gray-900 dark:text-white"
																>
																	{feature.name}
																	{featureIdx !== section.features.length - 1 ? (
																		<div className="absolute inset-x-8 mt-3 h-px bg-gray-200 dark:bg-white/10" />
																	) : null}
																</th>
																{pricing.tiers.map((tier) => (
																	<td key={tier.id} className="relative w-1/4 px-4 py-0 text-center">
																		<span className="relative size-full py-3">
																			{typeof feature.tiers[tier.name] === 'string' ? (
																				<span
																					className={classNames(
																						tier.featured
																							? 'font-semibold text-indigo-600 dark:text-indigo-400'
																							: 'text-gray-900 dark:text-white',
																						'text-sm/6',
																					)}
																				>
																					{feature.tiers[tier.name]}
																				</span>
																			) : (
																				<>
																					{feature.tiers[tier.name] === true ? (
																						<CheckIcon
																							aria-hidden="true"
																							className="mx-auto size-5 text-indigo-600 dark:text-indigo-400"
																						/>
																					) : (
																						<XMarkIconMini
																							aria-hidden="true"
																							className="mx-auto size-5 text-gray-400 dark:text-gray-600"
																						/>
																					)}

																					<span className="sr-only">
																						{feature.tiers[tier.name] === true ? 'Yes' : 'No'}
																					</span>
																				</>
																			)}
																		</span>
																	</td>
																))}
															</tr>
														))}
													</tbody>
												</table>

												{/* Fake card borders */}
												<div
													aria-hidden="true"
													className="pointer-events-none absolute inset-x-8 inset-y-0 grid grid-cols-4 gap-x-8 before:block"
												>
													{pricing.tiers.map((tier) => (
														<div
															key={tier.id}
															className={classNames(
																tier.featured
																	? 'ring-2 ring-indigo-600 dark:ring-indigo-500'
																	: 'ring-1 ring-gray-900/10 dark:ring-white/10',
																'rounded-lg',
															)}
														/>
													))}
												</div>
											</div>
										</div>
									))}
								</div>
							</section>
						</div>
					</div>
				</form>

				{/* FAQ section */}
				<div className="mx-auto mt-24 max-w-7xl px-6 sm:mt-56 lg:px-8">
					<h2 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
						Frequently asked questions
					</h2>
					<dl className="mt-20 divide-y divide-gray-900/10 dark:divide-white/10">
						{faqs.map((faq) => (
							<div key={faq.id} className="py-8 first:pt-0 last:pb-0 lg:grid lg:grid-cols-12 lg:gap-8">
								<dt className="text-base/7 font-semibold text-gray-900 lg:col-span-5 dark:text-white">
									{faq.question}
								</dt>
								<dd className="mt-4 lg:col-span-7 lg:mt-0">
									<p className="text-base/7 text-gray-600 dark:text-gray-400">{faq.answer}</p>
								</dd>
							</div>
						))}
					</dl>
				</div>
			</main>
		</div>
	)
}