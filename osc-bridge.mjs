import OSC from "osc-js";

// ==============================
// OSC（SuperCollider）
// ==============================
const oscSC = new OSC({
  plugin: new OSC.DatagramPlugin({
    send: { host: "127.0.0.1", port: 57120 }
  })
});

// ==============================
// OSC（TidalCycles）
// ==============================
const oscTidal = new OSC({
  plugin: new OSC.DatagramPlugin({
    send: { host: "127.0.0.1", port: 6061 }
  })
});

oscSC.open();
oscTidal.open();

// ==============================
// パラメータ
// ==============================
const NUM_PARAMS = 4;
const INTERVAL_MS = 1000;
const ALPHA = 0.3;       // ← 小さくするとsmoothingが強くなる

let values = Array(NUM_PARAMS).fill(0);

// ==============================
// poll
// ==============================
async function poll() {
  try {
    const results = await Promise.all(
      Array.from({ length: NUM_PARAMS }, (_, i) =>
        fetch(`http://cy1runtimeapi.chronoevent.com/app/osc_fetch?type=osc${i}&token=keitaasyncstdo`)
          .then(res => res.text())
          .then(text => {
            const match = text.trim().match(/[-+]?\d*\.?\d+$/);
            const v = match ? parseFloat(match[0]) : values[i];
            console.log(`fetch osc${i}: ${v}`);
            return { i, v };
          })
          .catch(() => null)
      )
    );

    results.forEach(result => {
      if (!result) return;

      const { i, v } = result;

      // smoothing
      values[i] = ALPHA * v + (1 - ALPHA) * values[i];

      // 両方に送信
      const tdMsg = new OSC.Message("/ctrl", `osc${i}`, values[i]);

      // console.log(`osc${i}: ${tdMsg.Message}`);

      // oscSC.send(msg);
      oscTidal.send(tdMsg);
    });

  } catch (e) {
    console.error("poll error:", e.message);
  }
}

// ==============================
console.log(`OSC bridge started (${INTERVAL_MS}ms interval)`);
setInterval(poll, INTERVAL_MS);
