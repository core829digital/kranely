import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToAnchor() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (hash) {
            // Check if the element exists immediately
            const element = document.getElementById(hash.replace("#", ""));

            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
            } else {
                // If not found, wait a bit for component mount (handling internal routing delays)
                const timer = setTimeout(() => {
                    const delayedElement = document.getElementById(hash.replace("#", ""));
                    if (delayedElement) {
                        delayedElement.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                }, 500);
                return () => clearTimeout(timer);
            }
        } else {
            window.scrollTo(0, 0);
        }
    }, [pathname, hash]);

    return null;
}
