// components/MultiSourceImg.tsx
"use client";

import * as React from "react";
type Props = React.ImgHTMLAttributes<HTMLImageElement> & { srcs: string[] };

export default function MultiSourceImg({ srcs, alt, ...rest }: Props) {
    const [idx, setIdx] = React.useState(0);
    const src = srcs?.[idx];

    if (!src) return <div className="w-12 h-12 rounded-xl bg-black/10 dark:bg-white/10" />;

    return (
        <img
            {...rest}
            alt={alt}
            src={src}
            // advance on any load error (404/timeout/blocked)
            onError={() => setIdx((i) => Math.min(i + 1, srcs.length))}
        />
    );
}
