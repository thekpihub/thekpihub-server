import { Avatar, AvatarImage, AvatarFallback } from "thekpihub-wingcommander-frontend";

export function InitialsOnly() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Avatar>
        <AvatarFallback>AN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>RK</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>SP</AvatarFallback>
      </Avatar>
    </div>
  );
}

export function WithImageAndFallback() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Avatar>
        <AvatarImage src="https://i.pravatar.cc/64?img=12" alt="Ana Reyes" />
        <AvatarFallback>AR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://i.pravatar.cc/64?img=33" alt="Rohan Kapoor" />
        <AvatarFallback>RK</AvatarFallback>
      </Avatar>
    </div>
  );
}

export function TeamStack() {
  return (
    <div className="flex items-center">
      <Avatar className="border-2 border-background">
        <AvatarFallback>SP</AvatarFallback>
      </Avatar>
      <Avatar className="-ml-2 border-2 border-background">
        <AvatarFallback>AN</AvatarFallback>
      </Avatar>
      <Avatar className="-ml-2 border-2 border-background">
        <AvatarFallback>RK</AvatarFallback>
      </Avatar>
      <Avatar className="-ml-2 border-2 border-background">
        <AvatarFallback className="bg-primary text-primary-foreground">+4</AvatarFallback>
      </Avatar>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-[10px]">SP</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>SP</AvatarFallback>
      </Avatar>
      <Avatar className="h-12 w-12">
        <AvatarFallback className="text-base">SP</AvatarFallback>
      </Avatar>
    </div>
  );
}
