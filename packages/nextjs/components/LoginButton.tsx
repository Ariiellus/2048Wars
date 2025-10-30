// Hooks
import { useEffect, useState } from "react";
import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth";

// UI
import { toast } from "sonner";
import FunPurpleButton from "./FunPurpleButton";
import { Button } from "./ui/button";
import { Copy } from "lucide-react";
import { publicClient } from "~~/utils/client";
import { formatEther, Hex } from "viem";
import { post } from "~~/utils/fetch";

type LoginButtonProps = {
    resetGame: () => void;
};

export default function LoginButton({ resetGame }: LoginButtonProps) {
    const { login } = useLogin();
    const { logout } = useLogout();
    const { user, authenticated } = usePrivy();

    const [loginLoading, setLoginLoading] = useState(false);
    const [faucetLoading, setFaucetLoading] = useState(false);

    const handleLogin = async () => {
        setLoginLoading(true);

        try {
            login();
            setLoginLoading(false);
        } catch (err) {
            console.log("Problem logging in: ", err);
            setLoginLoading(false);
        }
    };

    const [address, setAddress] = useState("");
    useEffect(() => {
        if (!user) {
            setAddress("");
            return;
        }

        const [privyUser] = user.linkedAccounts.filter(
            (account) =>
                account.type === "wallet" &&
                account.walletClientType === "privy"
        );
        if (!privyUser || !(privyUser as any).address) {
            setAddress("");
            return;
        }

        setAddress((privyUser as any).address);
    }, [user]);

    const copyToClipboard = async () => {
        if (address) {
            await navigator.clipboard.writeText(address);
            toast.info("Copied to clipboard.");
        }
    };

    const abbreviatedAddress = address
        ? `${address.slice(0, 4)}...${address.slice(-2)}`
        : "";

    return (
        <>
            {user && authenticated ? (
                <div className="flex flex-col items-center">
                    <FunPurpleButton
                        text="New Game"
                        onClick={resetGame}
                            loadingText="Funding player..."
                        isLoading={faucetLoading}
                    />
                </div>
            ) : (
                <FunPurpleButton
                    text="Login"
                    loadingText="Creating player..."
                    isLoading={loginLoading}
                    onClick={handleLogin}
                />
            )}
        </>
    );
}
