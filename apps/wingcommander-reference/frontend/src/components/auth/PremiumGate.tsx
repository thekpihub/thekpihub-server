import { motion } from "framer-motion";
import { Lock, Sparkles, Zap, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PremiumGateProps {
  isLoading?: boolean;
  onUpgrade?: () => void;
  upgradeUrl?: string;
}

const FEATURES = [
  "Claude Opus 4.7 with extended thinking",
  "Autonomous multi-step agent",
  "RAG document intelligence",
  "AI image generation (FLUX Pro)",
  "Unlimited projects & files",
  "Prompt caching for 10× faster responses",
];

export default function PremiumGate({
  isLoading = false,
  onUpgrade,
  upgradeUrl = "https://thekpihub.com/pricing",
}: PremiumGateProps) {
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ditto-400 to-ditto-700 flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = upgradeUrl;
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ditto-500/20 to-ditto-700/20 border border-ditto-500/30 flex items-center justify-center">
            <Lock className="w-7 h-7 text-ditto-400" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold font-figtree mb-2">
            Premium Feature
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ditto Wingman is included in the{" "}
            <span className="text-ditto-400 font-medium">Premium</span> and{" "}
            <span className="text-ditto-400 font-medium">Enterprise</span> plans
            on thekpihub.com.
          </p>
        </div>

        {/* Feature list */}
        <div className="rounded-xl border border-border bg-card/40 p-4 mb-6 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            What you unlock
          </p>
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <Zap className="w-3.5 h-3.5 text-ditto-400 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            className="w-full gap-2 h-11"
            variant="gradient"
            onClick={handleUpgrade}
          >
            Upgrade to Premium
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already a subscriber?{" "}
            <a
              href="https://thekpihub.com/dashboard"
              className="text-ditto-400 hover:underline"
            >
              Go to your dashboard
            </a>{" "}
            to open Wingman.
          </p>
        </div>

        {/* Branding */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
          <Sparkles className="w-3 h-3" />
          <span>Ditto Wingman · For humanity · Forever</span>
        </div>

        {/* Badge */}
        <div className="mt-3 flex justify-center">
          <Badge variant="outline" className="text-xs gap-1">
            <Lock className="w-2.5 h-2.5" /> Premium only
          </Badge>
        </div>
      </motion.div>
    </div>
  );
}
