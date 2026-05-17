export function PrivacyPolicy() {
  return (
    <main className="pt-16 bg-white text-gray-900">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Legal</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Privacy Policy</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
              This page explains how we collect, use, and protect information when you use our concierge-style platform.
            </p>
          </div>
        </div>
      </section>

      <section className="ykb-section px-4 sm:px-6 lg:px-8">
        <div className="ykb-container">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">What information we collect</h2>
              <p className="mt-2 text-sm text-textSecondary">
                We collect information you provide to request services or to manage your account, such as contact details and the
                details needed to process your request.
              </p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">How we use it</h2>
              <p className="mt-2 text-sm text-textSecondary">
                We use your information to provide the requested services, coordinate communication, improve the platform, and
                respond to questions or support requests.
              </p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">Sharing & service partners</h2>
              <p className="mt-2 text-sm text-textSecondary">
                We may share limited information with relevant service providers and trusted partners when it’s necessary to
                fulfill requests or operate the platform.
              </p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">Data retention</h2>
              <p className="mt-2 text-sm text-textSecondary">
                We keep information only as long as needed for the purposes described in this policy, or as required by applicable
                legal obligations.
              </p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">Security</h2>
              <p className="mt-2 text-sm text-textSecondary">
                We take reasonable measures to help protect information from unauthorized access, loss, misuse, or alteration.
              </p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">Your choices</h2>
              <p className="mt-2 text-sm text-textSecondary">
                You can typically review or update certain account details and request assistance with privacy-related questions by
                contacting us through the details in the footer.
              </p>
            </div>
          </div>

          <div className="mt-4 ykb-card">
            <h2 className="text-base font-semibold text-primary">Cookies & similar technologies</h2>
            <p className="mt-2 text-sm text-textSecondary">
              We may use cookies or similar technologies to improve performance, remember preferences, and understand how the site is
              used. You can manage cookie settings through your browser.
            </p>
          </div>

          <div className="mt-4 ykb-card">
            <h2 className="text-base font-semibold text-primary">Contact us</h2>
            <p className="mt-2 text-sm text-textSecondary">
              For privacy questions, feedback, or requests, contact us using the information provided in the footer.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
