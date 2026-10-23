import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "SoundSnap",
  description: "Real-time multiplayer music quiz",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <ClerkProvider afterSignOutUrl="/">
          <ConvexClientProvider>
            <header className="border-b border-zinc-800 px-4 py-3 flex justify-end gap-2">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium">
                    Sign up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </header>
            {children}
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
