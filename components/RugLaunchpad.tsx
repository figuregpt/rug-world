"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const collections = [
  {
    name: "Collection Alpha",
    status: "Live",
    supply: "5,000",
    minted: "3,247",
    price: "0.5 SOL",
    pct: 65,
  },
  {
    name: "Collection Beta",
    status: "Upcoming",
    supply: "3,333",
    minted: "-",
    price: "TBA",
    pct: 0,
  },
  {
    name: "Collection Gamma",
    status: "Upcoming",
    supply: "10,000",
    minted: "-",
    price: "TBA",
    pct: 0,
  },
];

export default function RugLaunchpad() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="launchpad" className="bg-[#2F2B28] py-[clamp(64px,8vw,120px)]">
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="border-b border-[#EDE3BC]/10 mb-10 pb-4">
            <span className="block text-[12px] font-mono text-[#A64C4F] mb-0.5">04</span>
            <span className="block text-[15px] sm:text-[16px] font-semibold text-[#EDE3BC]">
              Launchpad
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-12">
            <div>
              <h2 className="text-[clamp(32px,3.5vw,48px)] font-bold text-[#EDE3BC] leading-[1.1] mb-6">
                Curated drops only.
              </h2>
              <p className="text-[clamp(15px,1.2vw,17px)] text-[#EDE3BC]/40 leading-[1.7] max-w-[440px]">
                Every collection on Campfire is hand-picked. We partner with artists and teams that share our vision. No open mints, no anonymous drops. Quality over quantity.
              </p>
            </div>
          </div>

          {/* Collection cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((col, i) => (
              <motion.div
                key={col.name}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="border border-[#EDE3BC]/10 p-6 hover:border-[#A64C4F]/30 transition-all"
              >
                {/* Placeholder art */}
                <div className="aspect-square bg-[#EDE3BC]/5 mb-4 flex items-center justify-center">
                  <span className="text-[48px] font-black text-[#EDE3BC]/10">
                    {col.name.split(" ")[1][0]}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[16px] font-bold text-[#EDE3BC]">{col.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                    col.status === "Live"
                      ? "bg-[#A64C4F]/20 text-[#A64C4F]"
                      : "bg-[#EDE3BC]/8 text-[#EDE3BC]/40"
                  }`}>
                    {col.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#EDE3BC]/30">Supply</span>
                    <span className="text-[#EDE3BC]/60 font-medium">{col.supply}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#EDE3BC]/30">Minted</span>
                    <span className="text-[#EDE3BC]/60 font-medium">{col.minted}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#EDE3BC]/30">Price</span>
                    <span className="text-[#A64C4F] font-medium">{col.price}</span>
                  </div>
                </div>

                {/* Progress bar */}
                {col.pct > 0 && (
                  <div className="mt-4">
                    <div className="h-[3px] bg-[#EDE3BC]/8 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${col.pct}%` } : {}}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                        className="h-full bg-[#A64C4F]"
                      />
                    </div>
                    <p className="text-[11px] text-[#EDE3BC]/25 mt-1 text-right font-mono">
                      {col.pct}%
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
