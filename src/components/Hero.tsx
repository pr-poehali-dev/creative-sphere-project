import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

export default function Hero({ onPlayClick }: { onPlayClick?: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "50vh"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
    >
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src="https://cdn.poehali.dev/projects/a4412636-f39f-4265-b857-656739fd9327/files/8b4fb35d-2399-4ab8-81d0-ab5555c2782c.jpg"
          alt="Casino slot machines"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </motion.div>

      <div className="relative z-10 text-center text-white px-6">
        <p className="text-sm uppercase tracking-[0.3em] mb-4 text-yellow-400 font-medium">Лучшие онлайн-слоты</p>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-none">
          СОРВИ<br /><span className="text-yellow-400">ДЖЕКПОТ</span>
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-10 text-neutral-200">
          Сотни игровых слотов, щедрые бонусы и мгновенные выплаты. Удача уже ждёт тебя.
        </p>
        <button onClick={onPlayClick} className="bg-yellow-400 text-black font-bold px-10 py-4 text-sm uppercase tracking-wide hover:bg-yellow-300 transition-colors duration-300 cursor-pointer">
          Играть сейчас
        </button>
      </div>
    </div>
  );
}