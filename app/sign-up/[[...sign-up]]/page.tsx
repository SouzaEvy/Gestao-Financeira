import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-card border border-border shadow-xl rounded-xl",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            formButtonPrimary: "bg-sky-500 hover:bg-sky-600 text-white",
            formFieldInput:
              "bg-background border-border text-foreground placeholder:text-muted-foreground",
            formFieldLabel: "text-foreground",
            footerActionLink: "text-sky-400 hover:text-sky-300",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground",
            socialButtonsBlockButton:
              "border-border text-foreground hover:bg-accent",
            socialButtonsBlockButtonText: "text-foreground",
          },
        }}
      />
    </div>
  );
}
