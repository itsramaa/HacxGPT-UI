import { GlobeIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSelector({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (v: string) => void;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
          <GlobeIcon size={16} />
        </div>
        <h2 className="text-lg font-bold tracking-tight">
          Intelligence Interface
        </h2>
      </div>

      <Card className="border-border/30 bg-card/40 backdrop-blur-md shadow-2xl shadow-orange-500/5 rounded-[1.5rem]">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-90">
            Language Mapping
          </CardTitle>
          <CardDescription className="text-[11px] leading-relaxed">
            Force the AI engine to speak in a specific dialect.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Global Output Language
            </Label>
            <Select value={value || "auto"} onValueChange={onValueChange}>
              <SelectTrigger className="h-11 bg-background/50 border-border/20 w-full rounded-xl">
                <SelectValue placeholder="System Default" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-2xl border-border/40">
                {[
                  { label: "Auto-Detect", value: "auto" },
                  { label: "Indonesian", value: "Indonesian" },
                  { label: "English", value: "English" },
                  { label: "Japanese", value: "Japanese" },
                  { label: "Chinese", value: "Chinese" },
                  { label: "Korean", value: "Korean" },
                  { label: "French", value: "French" },
                  { label: "German", value: "German" },
                  { label: "Spanish", value: "Spanish" },
                  { label: "Russian", value: "Russian" },
                  { label: "Arabic", value: "Arabic" },
                ].map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-muted-foreground italic px-1 opacity-60">
            * Forced language overrides user input detection.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
