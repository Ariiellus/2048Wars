import { NetworkOptions } from "./NetworkOptions";
import { useDisconnect } from "wagmi";
import { ArrowLeftOnRectangleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export const WrongNetworkDropdown = () => {
  const { disconnect } = useDisconnect();

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 px-2 py-2 bg-base-200 rounded-lg">
          <div className="text-warning text-xs">Error</div>
        </div>
        <span className="text-xs text-success">Foundry</span>
      </div>
      <div className="dropdown dropdown-end">
        <label tabIndex={0} className="btn btn-ghost btn-sm gap-1 w-40">
          <span>Switch Network</span>
          <ChevronDownIcon className="h-4 w-4" />
        </label>
        <ul
          tabIndex={0}
          className="dropdown-content menu p-2 mt-2 shadow-lg bg-base-100 rounded-box gap-1 min-w-48 border border-base-300"
        >
          <NetworkOptions />
          <div className="divider my-1"></div>
          <li>
            <button
              className="text-error hover:bg-error/10 rounded-lg flex gap-2 py-2 px-3 transition-colors"
              type="button"
              onClick={() => disconnect()}
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4" />
              <span>Disconnect</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};
