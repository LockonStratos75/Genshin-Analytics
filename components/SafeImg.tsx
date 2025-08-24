// path: components/SafeImg.tsx
"use client";

import * as React from "react";

type Props = {
    src?: string | null;
    alt: string;
    fallback?: string;
    className?: string;
    width?: number;
    height?: number;
};

export default function SafeImg({
                                    src,
                                    alt,
                                    fallback = "/icons/char.svg",
                                    className,
                                    width,
                                    height,
                                }: Props) {
    const [url, setUrl] = React.useState<string>(src || fallback);

    return (
        <img
            src={url}
            alt={alt}
            width={width}
            height={height}
            className={className}
            onError={(e) => {
                // prevent loops
                const img = e.currentTarget;
                if (img.dataset.fallenBack === "1") return;
                img.dataset.fallenBack = "1";
                setUrl(fallback);
            }}
        />
    );
}
