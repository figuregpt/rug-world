"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function RugAbout() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="bg-[#2F2B28] py-[clamp(80px,12vw,160px)]">
      <div className="container-main">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">
          {/* Left: visual */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Abstract staking visual */}
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-square bg-[#A64C4F]/10 border border-[#A64C4F]/20 flex items-center justify-center">
                <div className="text-center">
                  <span className="block text-[48px] font-black text-[#A64C4F]">S</span>
                  <span className="text-[11px] text-[#EDE3BC]/30 tracking-[0.15em] uppercase">Stake</span>
                </div>
              </div>
              <div className="aspect-square bg-[#EDE3BC]/5 border border-[#EDE3BC]/10 flex items-center justify-center">
                <div className="text-center">
                  <span className="block text-[48px] font-black text-[#EDE3BC]/60">E</span>
                  <span className="text-[11px] text-[#EDE3BC]/30 tracking-[0.15em] uppercase">Earn</span>
                </div>
              </div>
              <div className="col-span-2 aspect-[2/1] bg-[#EDE3BC]/5 border border-[#EDE3BC]/10 flex items-center justify-center">
                <div className="text-center">
                  <span className="block text-[40px] font-black text-[#DEA831]/60">R</span>
                  <span className="text-[11px] text-[#EDE3BC]/30 tracking-[0.15em] uppercase">Royalties</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <p className="text-[13px] text-[#A64C4F] tracking-[0.15em] uppercase mb-6">
              Why Rug World
            </p>

            <h2 className="text-[clamp(28px,3vw,42px)] font-bold text-[#EDE3BC] leading-[1.2] mb-8">
              Launch your collection. Share royalties with holders.
            </h2>

            <div className="space-y-5 text-[clamp(15px,1.1vw,17px)] text-[#EDE3BC]/50 leading-[1.7]">
              <p>
                The royalty model is broken. Creators collect fees on every secondary sale while holders, the ones who actually keep the community alive, get nothing.
              </p>
              <p>
                Rug World flips that. We built a launchpad where royalties from secondary sales flow directly to stakers. You hold, you stake, you earn. Every single trade puts money back in the community's pocket.
              </p>
              <p>
                Launch your own collection. Use our built-in art generator to produce thousands of unique NFTs from your traits. Set your own royalty split. Every collection that launches on Rug World inherits the royalty share system out of the box.
              </p>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
