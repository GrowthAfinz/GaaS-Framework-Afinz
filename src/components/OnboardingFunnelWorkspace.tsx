import React, { ReactNode } from 'react';

type OnboardingFunnelWorkspaceProps = {
  navigation: ReactNode;
  sidebarMeta?: ReactNode;
  children: ReactNode;
};

export const OnboardingFunnelWorkspace: React.FC<OnboardingFunnelWorkspaceProps> = ({
  navigation,
  sidebarMeta,
  children,
}) => (
  <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_clamp(360px,22vw,420px)]">
    <main className="onboarding-funnel-workspace order-2 flex min-w-0 flex-col overflow-hidden border border-slate-200 bg-white xl:order-1">
      {children}
    </main>

    <aside className="order-1 flex min-w-0 flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#063b3d] via-[#0a5f63] to-[#00838a] text-white shadow-sm xl:order-2">
      <div className="p-5">{navigation}</div>
      {sidebarMeta && (
        <div className="border-t border-white/15 bg-[#052f31]/35 p-5">
          {sidebarMeta}
        </div>
      )}
    </aside>
  </div>
);
