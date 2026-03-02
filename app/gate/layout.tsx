import type { Metadata } from 'next';

export const metadata: Metadata = {
    // Explicitly remove the manifest for the gate page so browsers 
    // do not offer native "Add to Home Screen" as a PWA
    manifest: null,
};

export default function GateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
