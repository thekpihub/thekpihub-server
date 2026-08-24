import { Tabs, TabsList, TabsTrigger, TabsContent } from "thekpihub-wingcommander-frontend";

export function WorkspaceOverview() {
  return (
    <Tabs defaultValue="overview" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-sm text-muted-foreground">
        Revenue is up 12% week over week, driven mostly by repeat customers in the Wingcommander
        workspace. Churn stayed flat at 2.1%.
      </TabsContent>
      <TabsContent value="activity" className="text-sm text-muted-foreground">
        Ana Reyes commented on the Weekly revenue review 2 minutes ago. Build #482 shipped to
        production 14 minutes ago.
      </TabsContent>
      <TabsContent value="billing" className="text-sm text-muted-foreground">
        Your Wingcommander plan renews on July 1. Next invoice is $249.00.
      </TabsContent>
    </Tabs>
  );
}

export function TeamSettings() {
  return (
    <Tabs defaultValue="members" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="members">Team</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
      </TabsList>
      <TabsContent value="members" className="text-sm text-muted-foreground">
        Ana Reyes, Marcus Chen, and Priya Nair have access to the Wingcommander dashboard.
      </TabsContent>
      <TabsContent value="permissions" className="text-sm text-muted-foreground">
        Admins can edit KPI thresholds. Members can only view dashboards and export reports.
      </TabsContent>
    </Tabs>
  );
}
