import OSC from "osc-js";

// ==============================
// OSC（oF）
// ==============================
const oscOF = new OSC({
  plugin: new OSC.DatagramPlugin({
    send: { host: "127.0.0.1", port: 2020 }
  })
});

// ==============================
// OSC（TidalCycles）
// ==============================
const oscTidal = new OSC({
  plugin: new OSC.DatagramPlugin({
    send: { host: "127.0.0.1", port: 6060 }
  })
});

// ==============================
// OSC（TidalCyclesm）
// ==============================
const oscTidalm = new OSC({
  plugin: new OSC.DatagramPlugin({
    send: { host: "127.0.0.1", port: 6061 }
  })
});

oscOF.open();
oscTidal.open();
oscTidalm.open();

// ==============================
// パラメータ
// ==============================
const NUM_PARAMS = 4;
const INTERVAL_MS = 1000;

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

      // smoothingなし（そのまま代入）
      values[i] = v;

      const tdMsg = new OSC.Message("/ctrl", `osc${i}`, values[i]);

      oscTidal.send(tdMsg);
      oscTidalm.send(tdMsg);
      oscOF.send(tdMsg);
    });

  } catch (e) {
    console.error("poll error:", e.message);
  }
}

// ==============================
console.log(`OSC bridge started (${INTERVAL_MS}ms interval)`);
setInterval(poll, INTERVAL_MS);
