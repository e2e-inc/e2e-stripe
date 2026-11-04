import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import Stripe from "stripe";

import { buttonClassName } from "@/components/ui/button";
import { formatUsd } from "@/lib/item";
import { getStripe } from "@/lib/stripe";

export default function ReturnPage({ searchParams }: PageProps<"/return">) {
  return (
    <main className="flex flex-1 flex-col justify-center px-e2e-3 py-e2e-8 md:px-e2e-6">
      <div className="mx-auto flex w-full max-w-105 flex-col gap-e2e-2">
        <Suspense fallback={<ResultPanel status="checking…" detail="asking Stripe about this payment." />}>
          <PaymentResult searchParams={searchParams} />
        </Suspense>
        <Link href="/" className={buttonClassName("outline", "w-full")}>
          back to checkout
        </Link>
      </div>
    </main>
  );
}

async function PaymentResult({ searchParams }: Pick<PageProps<"/return">, "searchParams">) {
  const { session_id: sessionId } = await searchParams;
  if (typeof sessionId !== "string") {
    return <ResultPanel status="no payment" detail="Stripe sends you here after you pay." />;
  }

  // Prerendering can resolve searchParams; Stripe must only be asked per request.
  await connection();
  const session = await retrieveSession(sessionId);
  if (!session) {
    return <ResultPanel status="not found" detail="Stripe has no checkout session with this id." />;
  }

  if (session.payment_status !== "paid") {
    return <ResultPanel status="not paid" detail="Stripe has no payment for this checkout." />;
  }

  const email = session.customer_details?.email;
  const amount = formatUsd(session.amount_total ?? 0);
  return <ResultPanel status="paid" detail={email ? `${amount} paid by ${email}.` : `${amount} paid.`} />;
}

async function retrieveSession(id: string): Promise<Stripe.Checkout.Session | null> {
  try {
    return await getStripe().checkout.sessions.retrieve(id);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError) return null;
    throw error;
  }
}

function ResultPanel({ status, detail }: { status: string; detail: string }) {
  return (
    <section
      aria-labelledby="result-heading"
      className="flex flex-col gap-e2e-1 border border-e2e-neutral-800 bg-e2e-neutral-800/40 p-e2e-3"
    >
      <h1 id="result-heading" className="type-caption text-e2e-neutral-500">
        payment
      </h1>
      <p data-testid="payment-status" className="mt-e2e-1 type-h3 text-e2e-off-white">
        {status}
      </p>
      <p className="type-body-m text-e2e-neutral-300">{detail}</p>
    </section>
  );
}
