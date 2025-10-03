import "@rainbow-me/rainbowkit/styles.css";
import { FarcasterProvider } from "~~/components/Farcaster-provider";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "2048Wars!",
  description: "Built with 🏗 Scaffold-ETH 2",
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: "https://2048-wars.vercel.app/thumbnail.jpg",
      button: {
        title: "Play 2048Wars!",
        action: {
          type: "launch_frame",
          name: "2048Wars!",
          url: "https://2048-wars.vercel.app/",
          splashImageUrl: "https://2048-wars.vercel.app/logo.svg",
          splashBackgroundColor: "#6200ea",
        },
      },
    }),
  },
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``}>
      <body>
        <ThemeProvider enableSystem forcedTheme="light">
          <FarcasterProvider>
            <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
          </FarcasterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
