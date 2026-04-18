"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function RugRoyalty() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const size = 260;
  const stroke = 44;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * radius;

  const stakerPct = 80;
  const teamPct = 20;
  const stakerLen = (stakerPct / 100) * circ;
  const teamLen = (teamPct / 100) * circ;

  const outerR = radius + stroke / 2;
  const labelR = outerR + 18;
  const stakerMid = (stakerPct / 2 / 100) * 2 * Math.PI;
  const teamMid = ((stakerPct + teamPct / 2) / 100) * 2 * Math.PI;

  const buildLabel = (angle: number) => {
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    const start = { x: cx + outerR * sinA, y: cy - outerR * cosA };
    const end = { x: cx + labelR * sinA, y: cy - labelR * cosA };
    const isRight = sinA >= 0;
    const label = { x: end.x + (isRight ? 30 : -30), y: end.y };
    const anchor: "start" | "end" = isRight ? "start" : "end";
    return { start, end, label, anchor };
  };

  const s = buildLabel(stakerMid);
  const t = buildLabel(teamMid);

  return (
    <section ref={ref} id="royalty" className="py-[clamp(48px,6vw,80px)]">
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="border-b border-[#C4B99A] mb-10 pb-4">
            <span className="block text-[12px] font-mono text-[#A64C4F] mb-0.5">03</span>
            <span className="block text-[15px] sm:text-[16px] font-semibold text-[#2F2B28]">
              Royalty Model
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16 items-center">
            {/* Donut chart */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative" style={{ width: size, height: size }}>
                <svg
                  width={size}
                  height={size}
                  viewBox={`0 0 ${size} ${size}`}
                  style={{ overflow: "visible" }}
                >
                  <g transform={`rotate(-90 ${cx} ${cy})`}>
                    <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#2F2B28" strokeOpacity="0.08" strokeWidth={stroke} />
                    <motion.circle
                      cx={cx} cy={cy} r={radius}
                      fill="none" stroke="#A64C4F" strokeWidth={stroke}
                      strokeDasharray={`${stakerLen} ${circ - stakerLen}`}
                      initial={{ strokeDashoffset: stakerLen }}
                      animate={inView ? { strokeDashoffset: 0 } : {}}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                      strokeLinecap="butt"
                    />
                    <motion.circle
                      cx={cx} cy={cy} r={radius}
                      fill="none" stroke="#2F2B28" strokeWidth={stroke}
                      strokeDasharray={`${teamLen} ${circ - teamLen}`}
                      strokeDashoffset={-stakerLen}
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ duration: 0.6, delay: 1.1 }}
                      strokeLinecap="butt"
                    />
                  </g>

                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 1.3 }}
                  >
                    <line x1={s.start.x} y1={s.start.y} x2={s.end.x} y2={s.end.y} stroke="#A64C4F" strokeWidth="1.2" />
                    <line x1={s.end.x} y1={s.end.y} x2={s.label.x + (s.anchor === "start" ? -4 : 4)} y2={s.label.y} stroke="#A64C4F" strokeWidth="1.2" />
                    <text x={s.label.x} y={s.label.y - 4} fontSize="10" fontFamily="ui-monospace, monospace" fill="#A64C4F" letterSpacing="1" textAnchor={s.anchor}>STAKERS</text>
                    <text x={s.label.x} y={s.label.y + 12} fontSize="15" fontWeight="700" fill="#2F2B28" textAnchor={s.anchor}>8%</text>

                    <line x1={t.start.x} y1={t.start.y} x2={t.end.x} y2={t.end.y} stroke="#2F2B28" strokeOpacity="0.5" strokeWidth="1.2" />
                    <line x1={t.end.x} y1={t.end.y} x2={t.label.x + (t.anchor === "start" ? -4 : 4)} y2={t.label.y} stroke="#2F2B28" strokeOpacity="0.5" strokeWidth="1.2" />
                    <text x={t.label.x} y={t.label.y - 4} fontSize="10" fontFamily="ui-monospace, monospace" fill="#826D62" letterSpacing="1" textAnchor={t.anchor}>TEAM</text>
                    <text x={t.label.x} y={t.label.y + 12} fontSize="15" fontWeight="700" fill="#2F2B28" textAnchor={t.anchor}>2%</text>
                  </motion.g>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[13px] font-mono text-[#A64C4F] tracking-[0.1em]">ROYALTY</span>
                  <span className="text-[52px] font-bold text-[#2F2B28] leading-none mt-1">10%</span>
                  <span className="text-[12px] text-[#826D62] mt-2">of every sale</span>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col justify-center lg:py-4">
              <h3 className="text-[clamp(32px,3.4vw,48px)] font-bold text-[#2F2B28] leading-[1.1] mb-5">
                Stakers eat every trade.
              </h3>
              <p className="text-[clamp(15px,1.2vw,17px)] text-[#826D62] leading-[1.7] max-w-[460px] mb-7">
                10% royalty on every secondary sale. 8% goes straight to stakers, 2% to the team. Stake your NFT, earn from every trade.
              </p>

              {/* Legend */}
              <div className="space-y-3 max-w-[420px]">
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#C4B99A]">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-[#A64C4F]" />
                    <span className="text-[14px] text-[#2F2B28] font-medium">Stakers</span>
                  </div>
                  <span className="text-[14px] font-mono text-[#2F2B28]">8%</span>
                </div>
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#C4B99A]">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-[#2F2B28]" />
                    <span className="text-[14px] text-[#826D62]">Team</span>
                  </div>
                  <span className="text-[14px] font-mono text-[#826D62]">2%</span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1">
                  <span className="text-[12px] font-mono text-[#8A8480] uppercase tracking-[0.1em]">Total Royalty</span>
                  <span className="text-[12px] font-mono text-[#A64C4F] uppercase tracking-[0.1em]">10%</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTO section */}
          <div className="mt-[clamp(60px,8vw,110px)] pt-[clamp(40px,5vw,60px)] border-t border-[#C4B99A]">
            <p className="text-[12px] font-mono text-[#A64C4F] tracking-[0.15em] uppercase mb-5">
              Community Takeover
            </p>
            <h3 className="text-[clamp(34px,4.2vw,60px)] font-bold text-[#2F2B28] leading-[1.05] mb-4 max-w-[900px]">
              Dead project? Take the wheel.
            </h3>
            <p className="text-[clamp(15px,1.2vw,17px)] text-[#826D62] leading-[1.7] max-w-[640px] mb-8">
              If a collection gets abandoned by its original team, anyone can step up and claim it. Contact our team, prove you have a plan, and take over. The art stays, the community stays, royalties keep flowing.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                { icon: "01", title: "Project Gets Abandoned", desc: "Original team goes silent. Community is left without leadership." },
                { icon: "02", title: "You Step Up", desc: "Contact Campfire team. Show your plan for the collection." },
                { icon: "03", title: "CTO Approved", desc: "Take over as new lead. Staking, royalties, everything keeps running." },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.15 }}
                  className="flex items-start gap-4 p-5 border border-[#C4B99A]"
                >
                  <div className="w-10 h-10 bg-[#A64C4F]/8 flex items-center justify-center flex-shrink-0">
                    <span className="text-[12px] font-mono font-bold text-[#A64C4F]">{item.icon}</span>
                  </div>
                  <div>
                    <span className="block text-[14px] font-semibold text-[#2F2B28]">{item.title}</span>
                    <span className="block text-[13px] text-[#826D62] mt-1 leading-[1.5]">{item.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
