"use client";

import { useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
};
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => { open: () => void } } }

function loadCheckoutScript() {
  return new Promise<boolean>(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PaymentCheckout({ bookingId, enabled }: { bookingId: string; enabled: boolean }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function checkout() {
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/payments/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId }) });
      const order = await response.json();
      if (!response.ok) throw new Error(order.error ?? "Payment is unavailable.");
      if (!await loadCheckoutScript() || !window.Razorpay) throw new Error("Razorpay checkout could not load. No payment was taken.");
      const checkout = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: "CollegePath", description: "Counselling session", order_id: order.orderId, handler: () => setMessage("Payment was submitted. The booking will update after secure server verification."), modal: { ondismiss: () => setMessage("Checkout closed. The booking remains unpaid.") } });
      checkout.open();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Payment is unavailable."); }
    finally { setPending(false); }
  }
  return <div><button className="btn-primary" type="button" onClick={checkout} disabled={!enabled || pending}>{pending ? <LoaderCircle className="spin" size={15} /> : <ShieldCheck size={15} />}{enabled ? "Pay securely" : "Payments not configured"}</button>{!enabled && <p className="data-note">No payment was taken. Add Razorpay test credentials to enable checkout.</p>}{message && <p className="data-note" role="status">{message}</p>}</div>;
}