import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Button,
} from "thekpihub-wingcommander-frontend";

export function Default() {
  return (
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="outline">Sync status</Button>
        </TooltipTrigger>
        <TooltipContent>Last synced 2 minutes ago</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
