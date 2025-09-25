import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Leaderboard",
  description: "2048Wars Leaderboard",
});

const LeaderboardLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default LeaderboardLayout;
