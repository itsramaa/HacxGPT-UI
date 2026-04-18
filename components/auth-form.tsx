import Form from "next/form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({
  action,
  children,
  defaultEmail = "",
  mode = "login",
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  mode?: "login" | "register";
}) {
  return (
    <Form action={action} className="flex flex-col gap-4">
      {mode === "register" ? (
        <>
          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-muted-foreground"
              htmlFor="username"
            >
              Username
            </Label>
            <Input
              autoComplete="username"
              autoFocus
              className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
              id="username"
              minLength={3}
              name="username"
              placeholder="johndoe"
              required
              type="text"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-muted-foreground"
              htmlFor="email"
            >
              Email
            </Label>
            <Input
              autoComplete="email"
              className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
              defaultValue={defaultEmail}
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-muted-foreground"
              htmlFor="fullName"
            >
              Full Name
            </Label>
            <Input
              autoComplete="name"
              className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
              id="fullName"
              name="fullName"
              placeholder="John Doe"
              type="text"
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <Label
            className="font-normal text-muted-foreground"
            htmlFor="identifier"
          >
            Username or Email
          </Label>
          <Input
            autoFocus
            className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
            defaultValue={defaultEmail}
            id="identifier"
            minLength={3}
            name="identifier"
            placeholder="johndoe or you@example.com"
            required
            type="text"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label className="font-normal text-muted-foreground" htmlFor="password">
          Password
        </Label>
        <Input
          className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
          id="password"
          minLength={6}
          name="password"
          placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
          required
          type="password"
        />
      </div>

      {children}
    </Form>
  );
}
