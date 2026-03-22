import OSC from "osc-js";

// fetchはグローバルで使える

const osc = new OSC({ open: { port: 9000 } });
osc.open();

const NUM_PARAMS = 4;
const INTERVAL_MS = 50;
const ALPHA = 0.3;

let values = Array(NUM_PARAMS).fill(0);

async function poll() {
  try {
    const results = await Promise.all(
      Array.from({ length: NUM_PARAMS }, (_, i) =>
        fetch(`http://cy1runtimeapi.chronoevent.com/app/osc_fetch?type=osc${i}`)
          .then(res => res.text())
          .then(text => {
            const v = parseFloat(text.split(" ")[1]);
            return { i, v: isNaN(v) ? values[i] : v };
          })
          .catch(() => null)
      )
    );

    results.forEach(result => {
      if (!result) return;

      const { i, v } = result;

      values[i] = ALPHA * v + (1 - ALPHA) * values[i];
      osc.send(new OSC.Message(`/osc${i}`, values[i]));
    });

  } catch (e) {
    console.error("poll error:", e.message);
  }
}

console.log("OSC bridge started");
setInterval(poll, INTERVAL_MS);
