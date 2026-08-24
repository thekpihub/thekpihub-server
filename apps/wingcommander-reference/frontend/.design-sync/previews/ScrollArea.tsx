import { ScrollArea } from "thekpihub-wingcommander-frontend";

export function NotificationFeed() {
  const notifications = [
    { who: "Ana Reyes", what: "commented on Weekly revenue review", when: "2m ago" },
    { who: "Deploy bot", what: "shipped build #482 to production", when: "14m ago" },
    { who: "Marcus Chen", what: "invited you to the Billing workspace", when: "31m ago" },
    { who: "Priya Nair", what: "resolved the churn-rate anomaly alert", when: "1h ago" },
    { who: "Sam Okafor", what: "assigned you a review on Dashboard KPIs", when: "2h ago" },
    { who: "Deploy bot", what: "rolled back build #479 due to failed health check", when: "3h ago" },
    { who: "Ana Reyes", what: "updated the Q3 retention target to 92%", when: "5h ago" },
    { who: "Lena Brooks", what: "shared the onboarding funnel report", when: "Yesterday" },
    { who: "Marcus Chen", what: "closed the support escalation for Acme Co.", when: "Yesterday" },
    { who: "Priya Nair", what: "added 3 new metrics to the Wingcommander dashboard", when: "2 days ago" },
  ];

  return (
    <ScrollArea className="h-48 w-64 rounded-md border">
      <div className="p-4">
        <h4 className="mb-3 text-sm font-medium leading-none">Recent activity</h4>
        {notifications.map((n) => (
          <div key={n.who + n.when} className="mb-3 text-sm last:mb-0">
            <p>
              <span className="font-medium">{n.who}</span>{" "}
              <span className="text-muted-foreground">{n.what}</span>
            </p>
            <p className="text-xs text-muted-foreground">{n.when}</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function FileList() {
  const files = [
    "Q3-revenue-summary.csv",
    "churn-cohort-analysis.xlsx",
    "onboarding-funnel.pdf",
    "dashboard-export-2024-06.json",
    "billing-reconciliation.csv",
    "team-velocity-report.pdf",
    "kpi-thresholds-config.json",
    "weekly-standup-notes.md",
  ];

  return (
    <ScrollArea className="h-48 w-64 rounded-md border">
      <div className="p-4">
        <h4 className="mb-3 text-sm font-medium leading-none">Workspace files</h4>
        {files.map((file) => (
          <div key={file} className="mb-2 text-sm last:mb-0">
            {file}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
