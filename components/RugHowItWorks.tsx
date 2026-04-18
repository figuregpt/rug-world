"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Curated Launch",
    desc: "Only approved collections drop on Campfire. Each project is vetted by our team before it hits the launchpad. No random mints, no rugs.",
  },
  {
    num: "02",
    title: "Mint & Collect",
    desc: "Mint from our curated drops on launch day. Every collection that launches inherits the Royalty Share system from day one.",
  },
  {
    num: "03",
    title: "Stake Your NFTs",
    desc: "Head to the staking page. Each collection has its own staking pool. Stake your NFTs to start earning from secondary market royalties.",
  },
  {
    num: "04",
    title: "Earn Royalties",
    desc: "Every secondary sale generates royalties. Instead of flowing to creators, those royalties are distributed to stakers. Hold, stake, earn. Simple.",
  },
];

export default function RugHowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="how-it-works" className="py-[clamp(64px,8vw,120px)]">
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="border-b border-[#C4B99A] mb-10 pb-4">
            <span className="block text-[12px] font-mono text-[#A64C4F] mb-0.5">02</span>
            <span className="block text-[15px] sm:text-[16px] font-semibold text-[#2F2B28]">
              How It Works
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-16">
            <div>
              <h2 className="text-[clamp(32px,3.5vw,48px)] font-bold text-[#2F2B28] leading-[1.1] mb-6">
                From launch to earning.<br />Four steps.
              </h2>
              <p className="text-[clamp(15px,1.2vw,17px)] text-[#826D62] leading-[1.7] max-w-[440px]">
                Campfire makes it dead simple. We handle the curation, you handle the staking. Royalties flow automatically, every time someone trades.
              </p>
            </div>
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="rug-card"
              >
                <span className="step-number">{step.num}</span>
                <h3 className="text-[18px] font-bold text-[#2F2B28] mt-4 mb-3">
                  {step.title}
                </h3>
                <p className="text-[14px] text-[#826D62] leading-[1.6]">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
