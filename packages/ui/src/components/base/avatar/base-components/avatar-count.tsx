// @ts-nocheck
// UUI kit source — pulled via `npx untitledui add`. Suppress
// type-check so `untitledui upgrade` stays a clean replace operation.
// Re-apply after every kit upgrade until UUI tightens types.
"use client";

import { cx } from "@/utils/cx";

interface AvatarCountProps {
    count: number;
    className?: string;
}

export const AvatarCount = ({ count, className }: AvatarCountProps) => (
    <div className={cx("absolute right-0 bottom-0 p-px", className)}>
        <div className="flex size-3.5 items-center justify-center rounded-full bg-fg-error-primary text-center text-[10px] leading-[13px] font-bold text-white">
            {count}
        </div>
    </div>
);