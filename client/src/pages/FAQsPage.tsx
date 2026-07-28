import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { api } from "../lib/api";
import { cn } from "../lib/utils";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-medium text-slate-900">{question}</span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-slate-400 transition", open && "rotate-180")}
        />
      </button>
      {open && <p className="pb-5 text-sm leading-relaxed text-slate-600">{answer}</p>}
    </div>
  );
}

export default function FAQsPage() {
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: api.getFaqs,
  });

  return (
    <Layout>
      <SEO title="FAQs" description="Frequently asked questions about TherapyConnect." />

      <section className="bg-gradient-to-br from-primary-50 to-white py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="section-title">Frequently Asked Questions</h1>
          <p className="section-subtitle">Everything you need to know about using TherapyConnect</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : faqs.length === 0 ? (
            <p className="text-center text-slate-600">No FAQs available yet.</p>
          ) : (
            <div>
              {faqs.map((faq) => (
                <FAQItem key={faq.id} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
