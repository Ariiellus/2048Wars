import "@rainbow-me/rainbowkit/styles.css";
import { FarcasterProvider } from "~~/components/Farcaster-provider";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

const baseMetadata = getMetadata({
  title: "2048Wars!",
  description: "Reach 2048, win rewards",
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
          splashImageUrl: "https://2048-wars.vercel.app/2048Wars-Logo.png",
          splashBackgroundColor: "#6200ea",
        },
      },
    }),
  },
});

export const metadata = {
  ...baseMetadata,
  icons: {
    icon: [
      {
        url: "/2048Wars-Logo.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  },
};

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
