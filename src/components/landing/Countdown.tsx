import { useState, useEffect } from "react";
import { format } from "date-fns";
import { EVENT_CONFIG } from "@/config/event";

const Countdown = () => {
  const nextEventDate = new Date(EVENT_CONFIG.nextEventDate);
  
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = nextEventDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeBlocks = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Seconds" },
  ];

  return (
    <section className="py-24 md:py-32 bg-foreground">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-muted-foreground/60 text-xs tracking-[0.3em] uppercase mb-4">
            Next Gathering
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-background tracking-tight mb-2">
            {format(nextEventDate, EVENT_CONFIG.displayFormat)}
          </h2>
          <p className="text-muted-foreground/40 text-sm">
            {EVENT_CONFIG.location}
          </p>
        </div>

        <div className="flex justify-center items-center gap-4 md:gap-8">
          {timeBlocks.map((block, index) => (
            <div key={block.label} className="flex items-center gap-4 md:gap-8">
              <div className="text-center">
                <div className="text-5xl md:text-7xl lg:text-8xl font-light text-background tracking-tighter tabular-nums">
                  {String(block.value).padStart(2, "0")}
                </div>
                <p className="text-muted-foreground/50 text-xs tracking-[0.2em] uppercase mt-2">
                  {block.label}
                </p>
              </div>
              {index < timeBlocks.length - 1 && (
                <span className="text-4xl md:text-6xl text-muted-foreground/30 font-extralight">
                  :
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Countdown;
