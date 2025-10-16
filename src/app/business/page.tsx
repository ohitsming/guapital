import { type Metadata } from 'next'

import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { GridList, GridListItem } from '@/components/GridList'
import { GridPattern } from '@/components/GridPattern'
import { PageIntro } from '@/components/PageIntro'
import { SectionIntro } from '@/components/SectionIntro'
import { StylizedImage } from '@/components/StylizedImage'
import { TagList, TagListItem } from '@/components/TagList'
import imageCrowd from '@/images/crowd.jpg'
import imageGraph from '@/images/graph.jpg'
import imageWhiteboard from '@/images/whiteboard.jpg'

import { Button } from '@/components/Button'

export default function ForBusinessLanding() {
    return (
        <>
            <PageIntro eyebrow="For Businesses, Content Creators, Founders & Product Teams" title="Stop Guessing. Start Validating.">
                <div className=''>
                    <p>
                        Every business decision is a bet. Launching a new feature, a new marketing campaign, or a new product without data is a gamble. LocalMoco helps you turn that gamble into a calculated investment. For a fraction of the cost of traditional market research, you can validate your assumptions with real users and avoid costly mistakes. Get the data you need to build with confidence.
                    </p>
                    <div className='mt-8 flex justify-start space-x-4'>
                        <Button href="/login" invert={false}>
                            Make Your First Decision
                        </Button>
                    </div>
                </div>
            </PageIntro>

            <div className="mt-24 space-y-24 [counter-reset:section] sm:mt-32 sm:space-y-32 lg:mt-40 lg:space-y-40">
                <AskQuestions />
                <TargetAudience />
                <GetAnswers />
            </div>

            <Values />
        </>
    )
}

function Section({ title, image, children }: any) {
    return (
        <Container className="group/section [counter-increment:section]">
            <div className="lg:flex lg:items-center lg:justify-end lg:gap-x-8 lg:group-even/section:justify-start xl:gap-x-20">
                <div className="flex justify-center">
                    <FadeIn className="w-135 flex-none lg:w-180">
                        <StylizedImage
                            {...image}
                            sizes="(min-width: 1024px) 41rem, 31rem"
                            className="justify-center lg:justify-end lg:group-even/section:justify-start"
                        />
                    </FadeIn>
                </div>
                <div className="mt-12 lg:mt-0 lg:w-148 lg:flex-none lg:group-even/section:order-first">
                    <FadeIn>
                        <div className="font-display text-base font-semibold before:text-neutral-300 before:content-['/_'] after:text-neutral-950 after:content-[counter(section,decimal-leading-zero)]" aria-hidden="true" />
                        <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-neutral-950 sm:text-4xl">
                            {title}
                        </h2>
                        <div className="mt-6">{children}</div>
                    </FadeIn>
                </div>
            </div>
        </Container>
    )
}

function AskQuestions() {
    return (
        <Section title="Frame Your Hypothesis" image={{ src: imageWhiteboard }}>
            <div className="space-y-6 text-base text-neutral-600">
                <p>
                    What&apos;s your most expensive assumption? Is it your pricing? Your new feature? Your landing page headline?
                </p>
                <p>
                    Our simple task builder helps you frame your riskiest assumptions as clear questions. Instead of spending weeks debating, you can launch a task with a small, predictable budget and get real-world feedback.
                </p>
            </div>
            <h3 className="mt-12 font-display text-base font-semibold text-neutral-950">
                Included Features
            </h3>
            <TagList className="mt-4">
                <TagListItem>Simple Task Builder</TagListItem>
                <TagListItem>Pre-built Templates</TagListItem>
                <TagListItem>Pay-As-You-Go Pricing</TagListItem>
                <TagListItem>AI-Assisted Questions</TagListItem>
            </TagList>
        </Section>
    )
}


function TargetAudience() {
    return (
        <Section title="Get Feedback from Your Actual Customers" image={{ src: imageCrowd, shape: 1 }}>
            <div className="space-y-8 text-base text-neutral-600">
                <p>
                    Feedback from the wrong audience is worse than no feedback at all. It sends you in the wrong direction.
                </p>
                <p>
                    Define your ideal customer profile with our demographic and interest-based targeting. We&apos;ll instantly match your task with verified users, so you&apos;re not just getting data—you&apos;re getting relevant data from the people you actually want to serve.
                </p>
            </div>
            <h3 className="mt-12 font-display text-base font-semibold text-neutral-950">
                Included Features
            </h3>
            <TagList className="mt-4">
                <TagListItem>Demographic Targeting</TagListItem>
                <TagListItem>Interest-Based Targeting</TagListItem>
                <TagListItem>Verified User Pool</TagListItem>
                <TagListItem>Real-Time Matching</TagListItem>
            </TagList>
        </Section>
    )
}
function GetAnswers() {
    return (
        <Section title="Go from Data to Decision, Faster" image={{ src: imageGraph, shape: 2 }}>
            <div className="space-y-6 text-base text-neutral-600">
                <p>
                    Time kills deals and delays learning. See results roll in in real-time and use our AI-powered summaries to quickly understand the &apos;so what?&apos; behind the data.
                </p>
                <p>
                    Stop debating opinions in endless meetings. Get the clarity you need to make the right decision and move on to the next challenge.
                </p>
            </div>
            <h3 className="mt-12 font-display text-base font-semibold text-neutral-950">
                Included Features
            </h3>
            <TagList className="mt-4">
                <TagListItem>Real-Time Dashboard</TagListItem>
                <TagListItem>AI-Powered Summaries</TagListItem>
                <TagListItem>Sentiment Analysis</TagListItem>
                <TagListItem>CSV Data Export</TagListItem>
            </TagList>
        </Section>
    )
}

function Values() {
    return (
        <div className="relative mt-24 pt-24 sm:mt-32 sm:pt-32 lg:mt-40 lg:pt-40">
            <div className="absolute inset-x-0 top-0 -z-10 h-[884px] overflow-hidden rounded-t-4xl bg-linear-to-b from-neutral-50">
                <GridPattern
                    className="absolute inset-0 h-full w-full mask-[linear-gradient(to_bottom_left,white_40%,transparent_50%)] fill-neutral-100 stroke-neutral-950/5"
                    yOffset={-270}
                />
            </div>
            <SectionIntro
                eyebrow="Our Promise"
                title="Feedback That Works for Everyone"
            >
                <p>
                    We believe the best feedback comes from a system that is fair and respectful to both sides. We&apos;re committed to building a platform where businesses get high-quality insight and earners are properly compensated for their time and expertise.
                </p>
            </SectionIntro>
            <Container className="mt-24">
                <GridList>
                    <GridListItem title="High-Quality Data">
                        Our system is designed to reward thoughtful feedback and filter out low-quality responses.
                    </GridListItem>
                    <GridListItem title="Fair & Transparent">
                        Clear, upfront pricing for businesses and fair compensation for earners. No hidden fees.
                    </GridListItem>
                    <GridListItem title="Privacy-Focused">
                        We never collect or share personal information. All feedback is anonymized.
                    </GridListItem>
                    <GridListItem title="Built for Speed">
                        Our entire platform is optimized to get you from question to answer as quickly as possible.
                    </GridListItem>
                    <GridListItem title="Always Improving">
                        We&apos;re constantly working on new tools and features to help you make better decisions.
                    </GridListItem>
                    <GridListItem title="Here to Help">
                        Have a question or need help with a task? Our team is here to support you.
                    </GridListItem>
                </GridList>
            </Container>
        </div>
    )
}
