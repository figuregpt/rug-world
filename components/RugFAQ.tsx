"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "What is Rug World?",
    a: "Rug World is a curated NFT launchpad on Solana with a built-in royalty share model. Only approved collections can launch here. We recommend a 10% royalty on every secondary sale. 8% goes to stakers, 2% goes to the team.",
  },
  {
    q: "How does royalty sharing work?",
    a: "When an NFT from a Rug World collection is sold on the secondary market, a 10% royalty kicks in. 8% of that goes directly to stakers of that collection. The remaining 2% goes to the collection team. Stake your NFT and you earn from every trade.",
  },
  {
    q: "What is a CTO (Community Takeover)?",
    a: "If a collection's original team abandons the project, anyone can step up and take over. Contact the Rug.World team, present your plan, and if approved you become the new lead. The art stays, the community stays, royalties keep flowing. Just with fresh leadership.",
  },
  {
    q: "Can anyone launch a collection?",
    a: "Yes. Rug World is permissionless. Head to Create, set up your collection, pick your royalty split between community and yourself, and deploy. You decide the terms.",
  },
  {
    q: "How does the art generator work?",
    a: "Head to the Studio. Upload your trait images organized by layer (background, body, eyes, etc.), set rarity weights, and the system generates unique combinations. Works at scale. 300 traits can produce 5000+ unique NFTs. Handles gigabytes of art via chunked IPFS uploads.",
  },
  {
    q: "Can I set my own royalty split?",
    a: "Yes. When launching, you pick the total royalty fee (recommended 10%) and how it splits between community (stakers) and yourself. Want 80% to community, 20% to you? Or 50/50? Your call.",
  },
  {
    q: "How do I stake my NFTs?",
    a: "Head to the staking page, connect your wallet, and select the collection you want to stake from. Each collection has its own staking pool. Stake your NFT and start earning from secondary sales.",
  },
  {
    q: "What does BOIS have to do with Rug World?",
    a: "BOIS holders benefit from every collection on Rug.World. There's a platform cut on every secondary sale across all collections, and a portion of that goes to BOIS holders. The more collections launch and trade, the more BOIS holders earn.",
  },
  {
    q: "What chain is Rug World on?",
    a: "Solana.",
  },
  {
    q: "What happens if I unstake?",
    a: "You stop earning royalties from that point forward. Any unclaimed royalties earned while staked are still yours to claim. You can re-stake at any time.",
  },
];

function FAQItem({ faq }: { faq: (typeof faqs)[0] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="faq-item" onClick={() => setOpen(!open)}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[clamp(15px,1.2vw,17px)] text-[#2F2B28] font-medium">{faq.q}</p>
        <svg
          className="faq-chevron flex-shrink-0 w-4 h-4 text-[#826D62]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="text-[14px] text-[#826D62] leading-relaxed mt-4 pr-8">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RugFAQ() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="faq-section" className="py-[clamp(60px,8vw,120px)]">
      <div className="container-main">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20">
          {/* Left title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">FAQ</h2>
            <p className="mt-4 text-[15px] text-[#826D62] leading-relaxed max-w-[280px]">
              Everything you need to know about Rug World.
            </p>
          </motion.div>

          {/* Right accordion */}
          <div>
            {faqs.map((faq, i) => (
              <FAQItem key={i} faq={faq} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
