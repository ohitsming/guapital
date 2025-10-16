import Image from "next/image";
import { SectionIntro } from "./SectionIntro";
import dashboard_screenshot from '@/images/screenshots/dashboard_screenshot.png'
import survey_screenshot from '@/images/screenshots/survey_screenshot.png'
import tools_screenshot from '@/images/screenshots/screenshot_tools.png'
import keyboard_screenshot from '@/images/screenshots/screenshot_keyboard.png'
import { LightBulbIcon, SparklesIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { List, ListItem } from '@/components/List'
import { StylizedImage } from '@/components/StylizedImage'
import image from '@/images/conversation.png'

export default function FeatureSection() {
	return (
		<>
			{/* How It Works */}
			<div className="py-24 sm:py-32">
				<SectionIntro
					eyebrow="How it works"
					title="Go from Idea to Insight in Four Steps"
				>
						<p>
								Our AI platform streamlines the entire feedback process, from initial concept to actionable analysis. Validate your ideas faster and build products that truly resonate with your customers.
						</p>
				</SectionIntro>

				<Container className="mt-16">
						<div className="lg:flex lg:items-center lg:justify-end">
								<div className="flex justify-center lg:w-1/2 lg:justify-end lg:pr-12">
										<FadeIn className="w-135 flex-none lg:w-180">
												<StylizedImage
														shape={0}
														src={image}
														sizes="(min-width: 1024px) 41rem, 31rem"
														className="justify-center lg:justify-end"
												/>
										</FadeIn>
								</div>
								<List className="mt-16 lg:mt-0 lg:w-1/2 lg:min-w-132 lg:pl-4">
										<ListItem title="1. Define Your Objective" icon={<LightBulbIcon className="h-8 w-8 text-neutral-950" />}>
												Simply state your research goal in plain English. Whether you&apos;re validating a new feature, testing a marketing campaign, or gauging customer satisfaction, our AI understands your intent.
										</ListItem>
										<ListItem title="2. Generate with AI" icon={<SparklesIcon className="h-8 w-8 text-neutral-950" />}>
												Our AI instantly crafts a customized survey with well-structured, unbiased questions designed to elicit the most valuable feedback. No more struggling with question types or wording.
										</ListItem>
										<ListItem title="3. Distribute Your Survey" icon={<ChartBarIcon className="h-8 w-8 text-neutral-950" />}>
												Deploy your survey with a single click and share it via a public link. Reach your target audience effortlessly and start collecting valuable responses.
										</ListItem>
										<ListItem title="4. Analyze & Act" icon={<ChartBarIcon className="h-8 w-8 text-neutral-950" />}>
												Access real-time results through an intuitive dashboard. Our AI-powered analytics highlight key trends and actionable insights, empowering you to make data-driven decisions with confidence.
										</ListItem>
								</List>
						</div>
				</Container>
			</div>

			<div className="bg-gray-50 py-24 sm:py-32 dark:bg-gray-900">
				<div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
					<SectionIntro
						eyebrow="Use Cases"
						title="From Idea to Insight, for Any Use Case"
					>
					</SectionIntro>
					<div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
						<div className="flex p-px lg:col-span-4">
							<div className="w-full overflow-hidden rounded-lg bg-white shadow outline outline-1 outline-black/5 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem] dark:bg-gray-800 dark:shadow-none dark:outline-white/15">
								<Image src={survey_screenshot} alt="LocalMoco survey screenshot" 
									className="h-80 object-cover object-top"/>
								<div className="p-10">
									<h3 className="text-sm/4 font-semibold text-gray-500 dark:text-gray-400">
										For Entrepreneurs & Innovators
									</h3>
									<p className="mt-2 text-lg font-medium tracking-tight text-gray-900 dark:text-white">
										Validate Your Next Big Idea
									</p>
									<p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
										Don&apos;t build in the dark. Get quantitative feedback on your business idea, new feature, or
										marketing campaign before you invest time and money. Test for product-market fit and make data-backed
										decisions.
									</p>
								</div>
							</div>
						</div>
						<div className="flex p-px lg:col-span-2">
							<div className="w-full overflow-hidden rounded-lg bg-white shadow outline outline-1 outline-black/5 lg:rounded-tr-[2rem] dark:bg-gray-800 dark:shadow-none dark:outline-white/15">
								<Image
									src={tools_screenshot} alt="Business Tools"
									className="h-80 object-cover"
								/>
								<div className="p-10">
									<h3 className="text-sm/4 font-semibold text-gray-500 dark:text-gray-400">
										For Product & Marketing Teams
									</h3>
									<p className="mt-2 text-lg font-medium tracking-tight text-gray-900 dark:text-white">
										Understand Your Customers
									</p>
									<p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
										Run Net Promoter Score (NPS), Customer Satisfaction (CSAT), or custom feedback surveys to improve
										retention, loyalty, and user experience.
									</p>
								</div>
							</div>
						</div>
						<div className="flex p-px lg:col-span-2">
							<div className="w-full overflow-hidden rounded-lg bg-white shadow outline outline-1 outline-black/5 lg:rounded-bl-[2rem] dark:bg-gray-800 dark:shadow-none dark:outline-white/15">
								<Image
									alt="Keyboard"
									src={keyboard_screenshot}
									className="h-80 object-cover object-left"
								/>
								<div className="p-10">
									<h3 className="text-sm/4 font-semibold text-gray-500 dark:text-gray-400">
										For Marketers & Strategists
									</h3>
									<p className="mt-2 text-lg font-medium tracking-tight text-gray-900 dark:text-white">
										Uncover Market Insights
									</p>
									<p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
										Segment your audience, understand their pain points, and discover new opportunities. Our AI helps you
										ask the right questions to the right people.
									</p>
								</div>
							</div>
						</div>
						<div className="flex p-px lg:col-span-4">
							<div className="w-full overflow-hidden rounded-lg bg-white shadow outline outline-1 outline-black/5 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem] dark:bg-gray-800 dark:shadow-none dark:outline-white/15">
								<Image src={dashboard_screenshot} alt="LocalMoco dashboard screenshot" className="h-80 object-cover object-top"/>
								<div className="p-10">
									<h3 className="text-sm/4 font-semibold text-gray-500 dark:text-gray-400">For Data Scientists</h3>
									<p className="mt-2 text-lg font-medium tracking-tight text-gray-900 dark:text-white">
										Go from Data to Decision in Minutes
									</p>
									<p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
										LocalMoco closes the loop from question to insight. After our AI helps you build the perfect survey based on your goals, our dashboard automatically analyzes the results. It surfaces key themes, sentiment, and actionable insights, so you can skip the spreadsheets and focus on making decisions.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}