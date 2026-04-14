"use client";

import { motion } from "framer-motion";

export default function RugHero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#2F2B28]">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(166,76,79,0.3) 0%, transparent 50%),
                         radial-gradient(circle at 80% 30%, rgba(222,168,49,0.15) 0%, transparent 40%)`,
      }} />

      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[clamp(36px,6vw,72px)] font-black text-[#EDE3BC] leading-[1.05] tracking-[-0.02em] mb-5"
        >
          Stake your NFTs.
          <br />
          <span className="text-[#A64C4F]">Earn from every trade.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-[clamp(15px,1.4vw,18px)] text-[#EDE3BC]/40 max-w-[480px] leading-[1.6] mb-10"
        >
          The launchpad where royalties flow back to the people.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex items-center gap-4"
        >
          <a href="/create" className="btn-solid">
            Launch Collection
          </a>
          <a href="/launchpad" className="btn-outline text-[#EDE3BC] border-[#EDE3BC]/20 hover:bg-[#EDE3BC]/10 hover:text-[#EDE3BC]">
            Explore Launches
          </a>
        </motion.div>
      </div>
    </section>
  );
}
