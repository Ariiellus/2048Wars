import React from "react";

type ContainerProps = {
    children: React.ReactNode; // Accepts any valid React element(s)
};

export default function Container({ children }: ContainerProps) {
    return (
        <div className="w-full max-w-md mx-auto p-2">
            {/* Main content area */}
            <div className="flex-1 w-full max-w-md flex flex-col">
                {children}
            </div>
        </div>
    );
}
