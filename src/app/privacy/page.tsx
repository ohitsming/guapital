export default function PrivacyPolicy() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-10 text-base text-gray-800">
            <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mb-8">Last updated: October 18, 2025</p>
            <p className="text-md mb-8 font-semibold">Welcome to Guapital!</p>

            <div className="privacy-policy">
                <p className="mb-6">
                    At Guapital, we understand that you&apos;re trusting us with your most sensitive financial information. This Privacy Policy explains how we collect, use, protect, and share your data when you use our net worth tracking platform and related services (the &quot;Services&quot;). We believe in transparency and your right to privacy—we will never sell your personal data to third parties.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">1. Information We Collect</h2>

                <h3 className="text-xl font-semibold mt-6 mb-3">Financial Account Information</h3>
                <p className="mb-4">
                    When you connect your financial accounts through Plaid, we collect account balances, transaction history, and account details (account type, institution name, account numbers). This data is necessary to calculate and display your net worth.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Cryptocurrency Wallet Data</h3>
                <p className="mb-4">
                    If you add cryptocurrency wallets, we collect your wallet addresses and use third-party services (Alchemy) to retrieve token balances and transaction history. We never store or have access to your private keys.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Manual Asset Information</h3>
                <p className="mb-4">
                    You may manually enter information about assets like real estate, vehicles, or other valuables. We store this information along with your valuation estimates and edit history.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Account and Profile Data</h3>
                <p className="mb-4">
                    We collect your email address, password (encrypted), age bracket (for percentile rankings), and account preferences. We may also collect device information, IP addresses, and usage analytics to improve our service.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">2. How We Use Your Information</h2>
                <p className="mb-4">We use your information to:</p>
                <ul className="list-disc ml-6 mb-4">
                    <li className="mb-2">Calculate and display your net worth across all asset types</li>
                    <li className="mb-2">Sync and update account balances and transaction data</li>
                    <li className="mb-2">Provide trend analysis and financial insights</li>
                    <li className="mb-2">Display your anonymized percentile ranking compared to other users (if you opt in)</li>
                    <li className="mb-2">Process subscription payments and manage your account</li>
                    <li className="mb-2">Send you service updates, security alerts, and support communications</li>
                    <li className="mb-2">Improve our platform through usage analytics and bug detection</li>
                    <li className="mb-2">Prevent fraud and maintain platform security</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-10 mb-4">3. Third-Party Service Providers</h2>
                <p className="mb-4">We work with trusted third-party services to provide our platform:</p>
                <ul className="list-disc ml-6 mb-4">
                    <li className="mb-2"><strong>Plaid:</strong> Connects to your bank and investment accounts securely</li>
                    <li className="mb-2"><strong>Alchemy:</strong> Retrieves cryptocurrency wallet balances and holdings</li>
                    <li className="mb-2"><strong>Supabase:</strong> Hosts our database and authentication infrastructure</li>
                    <li className="mb-2"><strong>Stripe:</strong> Processes subscription payments securely</li>
                    <li className="mb-2"><strong>AWS:</strong> Provides cloud hosting infrastructure</li>
                </ul>
                <p className="mb-4">
                    These providers are bound by strict data protection agreements and only access the minimum data necessary to perform their services. We never share your data with advertisers or data brokers.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">4. Data Security</h2>
                <p className="mb-4">
                    We implement industry-standard security measures including encryption at rest and in transit, secure authentication (OAuth 2.0), regular security audits, and automated backups. However, no system is 100% secure. We encourage you to use strong passwords and enable two-factor authentication when available.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">5. Data Retention and Deletion</h2>
                <p className="mb-4">
                    We retain your financial data for as long as you maintain an active account. If you delete your account, we will permanently delete your personal data within 30 days, except where we&apos;re required by law to retain certain records (e.g., transaction records for tax purposes). You can request deletion of your account at any time through your account settings or by contacting support.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">6. Your Privacy Rights</h2>
                <p className="mb-4">Depending on your location, you have the right to:</p>
                <ul className="list-disc ml-6 mb-4">
                    <li className="mb-2">Access your personal data and download a copy</li>
                    <li className="mb-2">Correct inaccurate information</li>
                    <li className="mb-2">Delete your account and associated data</li>
                    <li className="mb-2">Opt out of percentile rankings and community features</li>
                    <li className="mb-2">Withdraw consent for data processing (where consent is the legal basis)</li>
                    <li className="mb-2">Object to certain data processing activities</li>
                </ul>
                <p className="mb-4">
                    To exercise these rights, contact us at support@guapital.com. We&apos;ll respond within 30 days.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">7. Sharing and Disclosure</h2>
                <p className="mb-4">
                    We do NOT sell, rent, or trade your personal information. We may disclose your data only in these limited circumstances:
                </p>
                <ul className="list-disc ml-6 mb-4">
                    <li className="mb-2">With your explicit consent</li>
                    <li className="mb-2">To comply with legal obligations (court orders, subpoenas)</li>
                    <li className="mb-2">To protect our rights, property, or safety, or that of our users</li>
                    <li className="mb-2">In connection with a merger, acquisition, or sale of assets (users will be notified)</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-10 mb-4">8. Anonymized Data and Analytics</h2>
                <p className="mb-4">
                    We may use anonymized, aggregated data (that cannot identify you personally) for research, analytics, and to improve the platform. For details on our percentile ranking feature, see Section 8A below.
                </p>

                <h2 id="percentile-ranking" className="text-2xl font-semibold mt-10 mb-4">8A. Percentile Ranking Feature</h2>
                <p className="mb-4">
                    Guapital offers an optional percentile ranking feature that allows you to see how your net worth compares to other users in your age group. This feature is entirely opt-in and requires your explicit consent.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">What Data We Collect</h3>
                <p className="mb-4">If you opt in to percentile rankings, we collect:</p>
                <ul className="list-disc ml-6 mb-4">
                    <li className="mb-2"><strong>Age bracket:</strong> Your self-reported age group (e.g., &quot;26-28 years old&quot;) - we do NOT collect your exact birthdate</li>
                    <li className="mb-2"><strong>Net worth snapshots:</strong> Daily anonymized snapshots of your total net worth (assets minus liabilities)</li>
                    <li className="mb-2"><strong>Consent timestamp:</strong> The date and time you opted in, for compliance and audit purposes</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">How Rankings Are Calculated</h3>
                <p className="mb-4">
                    Your percentile rank is calculated by comparing your net worth to other Guapital users in your age bracket. To ensure statistical accuracy, especially for newer age groups with fewer users, we blend our real user data with data from the Federal Reserve&apos;s Survey of Consumer Finances (SCF 2022), which includes 6,000+ households.
                </p>
                <p className="mb-4">
                    As each age bracket reaches 1,000+ real Guapital users, we automatically transition to using 100% real user data for that bracket. This hybrid approach ensures you always get meaningful, accurate comparisons.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Privacy Protections</h3>
                <p className="mb-4">We take the following steps to protect your privacy:</p>
                <ul className="list-disc ml-6 mb-4">
                    <li className="mb-2"><strong>100% anonymous:</strong> Your exact net worth is NEVER shown to other users. Only aggregated statistics (medians, percentiles) are calculated.</li>
                    <li className="mb-2"><strong>No personally identifiable information:</strong> Rankings do not include your name, email, or any identifiable data.</li>
                    <li className="mb-2"><strong>Opt-in only:</strong> You must explicitly consent to participate. We never enroll users automatically.</li>
                    <li className="mb-2"><strong>Easy opt-out:</strong> You may withdraw consent and opt out at any time through your account settings or the percentile ranking modal. Your data will be excluded from future calculations immediately.</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Data Retention</h3>
                <p className="mb-4">
                    While you remain opted in, we retain your daily net worth snapshots to calculate trends and percentile movements over time. If you opt out, your data will be excluded from percentile calculations immediately, and we will delete your percentile-specific data (net worth snapshots, age bracket) within 30 days of your opt-out request. Historical snapshots used for your personal net worth trend charts are retained separately and are not affected by opting out of percentile rankings.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Your Rights</h3>
                <p className="mb-4">
                    Under GDPR and other privacy laws, you have the right to access, correct, or delete your percentile ranking data at any time. You may exercise these rights by opting out through your account settings or contacting us at support@guapital.com.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">9. International Data Transfers</h2>
                <p className="mb-4">
                    Your data may be processed and stored in the United States or other countries where our service providers operate. We ensure appropriate safeguards are in place, including Standard Contractual Clauses, to protect your data in compliance with applicable laws.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">10. Children&apos;s Privacy</h2>
                <p className="mb-4">
                    Guapital is not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors. If we learn that we&apos;ve collected data from a minor, we will delete it promptly.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">11. Changes to This Policy</h2>
                <p className="mb-4">
                    We may update this Privacy Policy from time to time. If we make material changes, we&apos;ll notify you via email or through a prominent notice in the app at least 30 days before the changes take effect. Your continued use of Guapital after changes become effective means you accept the updated policy.
                </p>

                <h2 className="text-2xl font-semibold mt-10 mb-4">12. Contact Us</h2>
                <p className="mb-2">
                    If you have questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <p className="mb-2"><strong>Email:</strong> <a href="mailto:support@guapital.com" className="text-blue-600 underline">support@guapital.com</a></p>
                <p className="mb-6">We&apos;re here to help and committed to protecting your privacy.</p>

            </div>

        </div>
    );
}
