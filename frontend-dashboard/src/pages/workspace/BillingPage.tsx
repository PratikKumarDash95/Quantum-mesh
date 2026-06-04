export function BillingPage() {
  const renewsOn = new Date();
  renewsOn.setDate(renewsOn.getDate() + 21);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-white/30 font-semibold mb-1">
          § BILLING
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Plan &amp; billing</h2>
      </div>

      <Section title="Current plan" action={<ChangePlanButton />}>
        <div className="flex items-center gap-5 p-4 rounded-lg bg-[#070d1a] border border-white/5">
          <div className="bg-black text-white rounded-lg px-5 py-3 font-bold text-lg shadow-inner">
            Pro
          </div>
          <div>
            <div className="text-sm font-semibold text-white/90">
              Manual renewal — no auto-charge.
            </div>
            <div className="text-xs text-white/40 mt-0.5">
              Expires on{' '}
              <span className="text-white/70 font-semibold">
                {renewsOn.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              .
            </div>
          </div>
        </div>
      </Section>

      <Section title="Payment">
        <div className="flex justify-between items-center p-4 rounded-lg bg-[#070d1a] border border-white/5">
          <div className="text-sm text-white/35">Method on file</div>
          <div className="text-sm text-white/85">
            Manual top-up (no auto-renewal).
          </div>
        </div>
      </Section>

      <Section title="Invoices">
        <div className="text-center py-10 rounded-lg bg-[#070d1a] border border-white/5 text-sm text-white/30">
          Invoices will appear after your first charge.
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-white/85">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function ChangePlanButton() {
  return (
    <button
      type="button"
      className="text-xs px-3 py-1.5 rounded-md border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors"
      onClick={() => alert('Plan management is not yet wired up.')}
    >
      Change Plan
    </button>
  );
}
