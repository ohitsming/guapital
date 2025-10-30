import { COMPANY_SUPPORT_ADDRESS } from '@/lib/constant';

export default function TermsOfService() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-10 text-base text-gray-800">
            <h1 className="text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-sm text-gray-500 mb-8">Last updated: October 29, 2025</p>
            <p className="text-md mb-8 font-semibold">Welcome to Guapital!</p>

            <p className="mb-2">
                These Terms of Service (&ldquo;Terms&rdquo;) constitute a binding legal agreement between you (&ldquo;you,&rdquo; &ldquo;your,&rdquo; or &ldquo;User&rdquo;) and LocalMoco LLC, doing business as Guapital (&ldquo;Guapital,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) governing your access to and use of our net worth tracking platform, website, applications, and related services (collectively, the &ldquo;Services&rdquo;).

            </p>
            <p className="mb-6">
                By accessing or using our Services, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in our Privacy Policy and these Terms of Service.
            </p>



            <div className="terms-container">
                <p className="mb-6">
                    By accessing or using the Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">1. The Guapital Service</h2>
                <p className="mb-4">
                    Guapital provides a financial tracking platform designed to help individuals monitor their net worth across traditional and modern assets. Our Services enable you to connect bank accounts, investment accounts, crypto wallets, and manually track other assets to calculate and visualize your total net worth over time. Use of the Services is subject to compliance with these Terms.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">2. Eligibility and Account Registration</h2>
                <p className="mb-4">
                    You must be at least 13 years old to use the Services. If under 18, you must have permission from a parent or legal guardian. You agree to provide accurate and complete information during registration and keep it up to date.
                </p>
                <p className="mb-4">
                    You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately of any unauthorized use.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">3. User Responsibilities</h2>
                <p className="mb-4">
                    You are solely responsible for maintaining the security of your account credentials and for all activity under your account. You agree to provide accurate information when connecting financial accounts and manually entering asset data. You acknowledge that Guapital provides informational tools only and does not provide financial, investment, tax, or legal advice. You are responsible for all payments for subscription services or any other features, processed via Stripe or other approved payment processors.
                </p>



                <h2 className="text-2xl font-semibold mt-10 mb-4">4. Data Ownership and Intellectual Property</h2>
                <p className="mb-4">
                    You retain all ownership rights to your financial data. We do not sell or share your personal financial information with third parties for marketing purposes. We use your data solely to provide the Services, generate aggregated and anonymized analytics, and improve our platform.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Percentile Ranking Feature</h3>
                <p className="mb-4">
                    Guapital offers an optional percentile ranking feature that allows you to compare your net worth to other users in your age group. This feature is entirely opt-in and requires your explicit consent. By opting in, you agree that:
                </p>
                <ul className="list-disc ml-6 mb-4">
                    <li className="mb-2">We may use your anonymized net worth data (age bracket + net worth snapshots) to calculate percentile rankings</li>
                    <li className="mb-2">Your data may be combined with Federal Reserve Survey of Consumer Finances (SCF) data to ensure statistical accuracy</li>
                    <li className="mb-2">Your exact net worth will never be shared with other users - only aggregated, anonymized statistics are used</li>
                    <li className="mb-2">You may opt out at any time, and your data will be excluded from future percentile calculations</li>
                </ul>
                <p className="mb-4">
                    For full details on how percentile rankings work and how we protect your privacy, please see Section 8A of our <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Trajectory Projection Feature</h3>
                <p className="mb-4">
                    Guapital offers net worth projection calculators (&quot;Trajectory&quot; feature) that display hypothetical future values based on mathematical formulas, historical market averages, and user-provided inputs. By using this feature, you explicitly acknowledge and agree that:
                </p>
                <ul className="list-disc ml-6 mb-4">
                    <li className="mb-2"><strong>Not Investment Advice:</strong> Guapital is not a registered investment advisor, broker-dealer, or financial planner. The Trajectory feature provides automated calculations for educational purposes only and does not constitute personalized financial, investment, tax, or legal advice.</li>
                    <li className="mb-2"><strong>Not a Recommendation:</strong> We do not recommend, endorse, or suggest any specific investment strategy, asset allocation, or financial product. All projections are based on generic assumptions and your inputs.</li>
                    <li className="mb-2"><strong>No Guarantees:</strong> Past performance does not guarantee or predict future results. All projections are hypothetical estimates that may not reflect actual future outcomes.</li>
                    <li className="mb-2"><strong>Simplified Assumptions:</strong> Projections use simplified assumptions (constant growth rates, no fees, taxes, inflation, contributions, or withdrawals). Real-world investment returns are affected by numerous factors not reflected in these calculations.</li>
                    <li className="mb-2"><strong>Your Responsibility:</strong> You are solely responsible for all financial decisions you make. You should not rely solely on these projections when making investment or financial planning decisions.</li>
                    <li className="mb-2"><strong>Consult Professionals:</strong> For personalized advice, consult a qualified and registered financial advisor, certified public accountant (CPA), or attorney licensed in your jurisdiction.</li>
                </ul>
                <p className="mb-4">
                    By using the Trajectory feature, you acknowledge that projections are provided &quot;as is&quot; for informational purposes only. Guapital makes no representations or warranties about the accuracy, completeness, or reliability of any projections. You waive any claims against Guapital arising from your reliance on these projections or any financial decisions you make based on them.
                </p>

                <p className="mb-4">
                    All intellectual property rights in the Services, including software, design, and branding, remain the exclusive property of Guapital and its licensors.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">5. Acceptable Use Policy</h2>
                <p className="mb-4">
                    You agree not to misuse the Services or use them for unlawful purposes, including impersonation, unauthorized access attempts, or interference with the Services.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">6. Termination</h2>
                <p className="mb-4">
                    We may suspend or terminate your access at any time for violation of these Terms or other lawful reasons. You may terminate your account at any time by contacting us. Termination does not waive any rights or obligations accrued prior.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">7. Disclaimers and Limitation of Liability</h2>
                <p className="mb-4">
                    THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. GUAPITAL IS NOT A REGISTERED INVESTMENT ADVISOR, BROKER-DEALER, OR FINANCIAL PLANNER. GUAPITAL DOES NOT PROVIDE FINANCIAL, INVESTMENT, TAX, OR LEGAL ADVICE. THE SERVICES, INCLUDING ALL CALCULATORS, PROJECTIONS, AND ANALYTICS TOOLS, ARE FOR INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY.
                </p>
                <p className="mb-4">
                    GUAPITAL MAKES NO REPRESENTATIONS OR WARRANTIES REGARDING THE ACCURACY, COMPLETENESS, RELIABILITY, OR SUITABILITY OF ANY PROJECTIONS, CALCULATIONS, OR INFORMATION PROVIDED THROUGH THE SERVICES. ALL NET WORTH PROJECTIONS, INCLUDING THOSE PROVIDED BY THE TRAJECTORY FEATURE, ARE HYPOTHETICAL ESTIMATES BASED ON GENERIC ASSUMPTIONS AND DO NOT CONSTITUTE PREDICTIONS, RECOMMENDATIONS, OR GUARANTEES OF FUTURE PERFORMANCE.
                </p>
                <p className="mb-4">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, GUAPITAL AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OR INABILITY TO USE THE SERVICES, INACCURACIES IN DATA PROVIDED BY THIRD-PARTY FINANCIAL INSTITUTIONS, RELIANCE ON ANY PROJECTIONS OR CALCULATIONS, UNAUTHORIZED ACCESS, OR ANY FINANCIAL DECISIONS YOU MAKE BASED ON INFORMATION PROVIDED BY THE SERVICES.
                </p>
                <p className="mb-4">
                    YOU ACKNOWLEDGE THAT YOU USE THE SERVICES AT YOUR OWN RISK AND ARE SOLELY RESPONSIBLE FOR ALL FINANCIAL DECISIONS. YOU AGREE TO CONSULT WITH QUALIFIED PROFESSIONALS BEFORE MAKING ANY FINANCIAL, INVESTMENT, TAX, OR LEGAL DECISIONS. IN NO EVENT SHALL GUAPITAL&apos;S TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU PAID TO GUAPITAL IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">8. Indemnification</h2>
                <p className="mb-4">
                    You agree to indemnify, defend, and hold harmless Guapital and its affiliates from any claims, damages, losses, liabilities, costs, or expenses arising out of or related to your use of the Services, breach of these Terms, or violation of any law or third-party rights.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">9. Payment Processing</h2>
                <p className="mb-4">
                    Payments for Guapital subscription services and any other paid features are processed by third-party providers such as Stripe. You agree to comply with their terms and acknowledge that Guapital is not responsible for any issues arising from payment processing.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">10. Governing Law and Jurisdiction</h2>
                <p className="mb-4">
                    These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.
                </p>
                <p className="mb-4">
                    Any disputes will be resolved exclusively through binding arbitration as detailed below, except for small claims court as permitted.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">11. Binding Arbitration and Waiver of Class Actions</h2>
                <p className="mb-4 font-semibold">
                    PLEASE READ THIS SECTION CAREFULLY — IT AFFECTS YOUR RIGHTS.
                </p>
                <p className="mb-4">
                    Except for disputes eligible for small claims court, you agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Services shall be resolved exclusively by binding arbitration administered by the American Arbitration Association (&quot;AAA&quot;) under its Consumer Arbitration Rules.
                </p>
                <p className="mb-4">
                    The arbitration will be conducted by a single arbitrator in Wilmington, Delaware, or another mutually agreed location. Judgment on the award may be entered in any court having jurisdiction.
                </p>
                <p className="mb-4">
                    YOU AND GUAPITAL AGREE THAT ALL DISPUTES WILL BE RESOLVED ON AN INDIVIDUAL BASIS. THERE WILL BE NO CLASS ACTIONS OR REPRESENTATIVE ACTIONS.
                </p>
                <p className="mb-4">
                    If any part of this arbitration agreement is found unenforceable, the remaining provisions will remain in full effect.
                </p>
                <p className="mb-4">
                    This arbitration agreement does not prevent you from bringing an individual claim in small claims court if it qualifies.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">12. Changes to These Terms</h2>
                <p className="mb-4">
                    We may update these Terms at any time. We will notify you of material changes by posting updated Terms on our website. Continued use of the Services after changes indicates your acceptance.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">13. Contact Us</h2>
                <p className="mb-2">
                    For questions about these Terms, please contact:
                </p>
                <p className="mb-2"><strong>Email:</strong> <a href={`mailto:${COMPANY_SUPPORT_ADDRESS}`} className="text-blue-600 underline">{COMPANY_SUPPORT_ADDRESS}</a></p>
            </div>
        </div>
    );
}