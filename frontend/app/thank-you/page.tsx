"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// Screen after Screen 3 (payment) completes and Lemon Squeezy redirects back here.
// It polls briefly because the webhook that unlocks the download can land a
// second or two after the browser redirect does.
export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouContent />
    </Suspense>
  );
}

function ThankYouContent() {
  const params = useSearchParams();
  const ref = params.get("ref");
  const [state, setState] = useState<"waiting" | "ready" | "used" | "timeout">("waiting");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      const res = await fetch(`/api/order-status?ref=${ref}`);
      const data = await res.json();

      if (data.status === "paid") {
        clearInterval(interval);
        if (data.tokenUsed) {
          setState("used");
        } else {
          setDownloadUrl(data.downloadUrl);
          setState("ready");
        }
      } else if (attempts >= 15) {
        clearInterval(interval);
        setState("timeout");
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [ref]);

  return (
    <div className="max-w-md mx-auto bg-white border rounded-lg p-8 text-center">
      {state === "waiting" && (
        <>
          <h1 className="font-medium text-lg mb-2">Confirming your payment...</h1>
          <p className="text-gray-500 text-sm">This usually takes just a few seconds.</p>
        </>
      )}
      {state === "ready" && downloadUrl && (
        <>
          <h1 className="font-medium text-lg mb-2">Payment confirmed 🎉</h1>
          <p className="text-gray-500 text-sm mb-5">
            Your download link works once. Save the file after downloading —
            you'll need to purchase again to download it a second time.
          </p>
          <a
            href={downloadUrl}
            className="inline-block bg-brand-dark text-white rounded px-5 py-2.5 font-medium"
          >
            Download your file
          </a>
        </>
      )}
      {state === "used" && (
        <p className="text-gray-600">This order's download link has already been used.</p>
      )}
      {state === "timeout" && (
        <p className="text-gray-600">
          Still confirming — if this doesn't update shortly, contact support with your
          payment receipt.
        </p>
      )}
    </div>
  );
}
