import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  Button,
  Input,
} from "thekpihub-wingcommander-frontend";

export function ConfirmAction() {
  return (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Delete workspace</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this workspace?</DialogTitle>
          <DialogDescription>
            This permanently removes the Wingcommander workspace and every file inside it. This
            action can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete workspace</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FormDialog() {
  return (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button>Invite teammate</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a teammate</DialogTitle>
          <DialogDescription>
            They'll get an email with a link to join this workspace.
          </DialogDescription>
        </DialogHeader>
        <Input type="email" placeholder="teammate@company.com" defaultValue="ana@thekpihub.com" />
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
