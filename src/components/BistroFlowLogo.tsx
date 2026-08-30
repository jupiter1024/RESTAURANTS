import React from 'react';

interface BistroFlowLogoProps {
  size?: 'sm' | 'md';
  showTagline?: boolean;
  dark?: boolean;
}

export const BistroFlowLogo: React.FC<BistroFlowLogoProps> = ({
  size = 'md',
  showTagline = false,
  dark = false,
}) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';

  const textSize = size === 'sm' ? 'text-base' : 'text-lg';

  return (<div className="flex items-center gap-2.5">
    <div
      className={`${iconSize} flex shrink-0 items-center justify-center rounded-xl ${dark ? 'bg-white text-zinc-950' : 'bg-zinc-950 text-white'
        }`}
    > <svg
      viewBox="0 0 24 24"
      className="h-[52%] w-[52%]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    > <path
          d="M5 7.5h14M5 12h14M5 16.5h14"
          strokeLinecap="round"
        /> <path
          d="M8 5v14M16 5v14"
          strokeLinecap="round"
          opacity="0.9"
        /> </svg> </div>

    <div className="flex flex-col leading-none">
      <span
        className={`${textSize} font-semibold tracking-[-0.035em] ${dark ? 'text-white' : 'text-zinc-950'
          }`}
      >
        BistroFlow
      </span>

      {showTagline && (
        <span
          className={`mt-1 text-[10px] font-medium ${dark ? 'text-zinc-500' : 'text-zinc-400'
            }`}
        >
          Restaurant website platform
        </span>
      )}
    </div>
  </div>

);
};
