import React from "react";

type ContainerProps = {
    children: React.ReactNode; // Accepts any valid React element(s)
};

export default function Container({ children }: ContainerProps) {
    return (
        <div className="min-h-[100dvh] flex flex-col items-center pb-16 pt-6 justify-between px-2 bg-gray-100 overflow-hidden">
            {/* Main content area */}
            <div className="flex-1 w-full max-w-md flex flex-col justify-between overflow-hidden">
                {children}
            </div>
        </div>
    );
}
