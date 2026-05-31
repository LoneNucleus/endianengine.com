const APP_VERSION = "v0.5.5.6";
const APP_RELEASE_LABEL = "STATIC FEATURE RESTORE";
const DATA_URL = "./data/nuclide-viewer/nuclides.json";
const MANIFEST_URL = "./data/nuclide-viewer/nuclide_manifest.json";
const SOURCE_MANIFEST_URL = "./data/nuclide-viewer/source_manifest.json";

const chartEl = document.getElementById("nuclideChart");
const statusEl = document.getElementById("dataStatus");
const searchBox = document.getElementById("searchBox");
const presetSelect = document.getElementById("presetSelect");
const geometryMode = document.getElementById("geometryMode");
const colorMode = document.getElementById("colorMode");
const sizeMode = document.getElementById("sizeMode");
const showLines = document.getElementById("showLines");
const stabilityFilter = document.getElementById("stabilityFilter");
const decayFilter = document.getElementById("decayFilter");
const halfLifeFilter = document.getElementById("halfLifeFilter");
const zMin = document.getElementById("zMin");
const zMax = document.getElementById("zMax");
const aMin = document.getElementById("aMin");
const aMax = document.getElementById("aMax");
const xAxis = document.getElementById("xAxis");
const yAxis = document.getElementById("yAxis");
const zAxis = document.getElementById("zAxis");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const cameraTopBtn = document.getElementById("cameraTopBtn");
const cameraIsoBtn = document.getElementById("cameraIsoBtn");
const cameraSideBtn = document.getElementById("cameraSideBtn");
const selectedNuclide = document.getElementById("selectedNuclide");
const legendContent = document.getElementById("legendContent");
const sourcesContent = document.getElementById("sourcesContent");
const orientationX = document.getElementById("orientationX");
const orientationY = document.getElementById("orientationY");
const orientationZ = document.getElementById("orientationZ");
const orientationNote = document.getElementById("orientationNote");

let allNuclides = [];
let manifest = null;
let sourceManifest = null;
let lastCamera = null;
let fieldLabels = {};

const numericFields = [
  "flat", "N", "Z", "A", "N-Z", "Z-N", "N/Z", "DiagPos", "DiagOff",
  "Decay1Percent", "Decay2Percent", "Decay3Percent", "Decay4Percent", "NumBranches",
  "MeanGammaEnergy_keV", "MeanBetaMinusEnergy_keV", "MeanBetaPlusECEnergy_keV", "MeanAlphaEnergy_keV", "MeanNeutronEnergy_keV",
  "Daughter1Z", "Daughter1N", "Daughter1A", "Daughter2Z", "Daughter2N", "Daughter2A", "Alpha", "HalfLifeRank", "EnergyTotal_keV", "DecayVectorMagnitude"
];

fieldLabels = {
  flat: "Flat plane",
  N: "N — Neutron number",
  Z: "Z — Proton / atomic number",
  A: "A — Mass number",
  "N-Z": "N−Z — Neutron excess",
  "Z-N": "Z−N — Proton excess",
  "N/Z": "N/Z — Neutron ratio",
  DiagPos: "Diag∥ — Along N=Z",
  DiagOff: "Diag⊥ — Offset from N=Z",
  Decay1Percent: "Decay 1 %",
  Decay2Percent: "Decay 2 %",
  Decay3Percent: "Decay 3 %",
  Decay4Percent: "Decay 4 %",
  NumBranches: "Decay branch count",
  MeanGammaEnergy_keV: "Mean γ energy keV",
  MeanBetaMinusEnergy_keV: "Mean β− energy keV",
  MeanBetaPlusECEnergy_keV: "Mean β+/EC energy keV",
  MeanAlphaEnergy_keV: "Mean α energy keV",
  MeanNeutronEnergy_keV: "Mean neutron energy keV",
  Daughter1Z: "Daughter 1 Z",
  Daughter1N: "Daughter 1 N",
  Daughter1A: "Daughter 1 A",
  Daughter2Z: "Daughter 2 Z",
  Daughter2N: "Daughter 2 N",
  Daughter2A: "Daughter 2 A",
  Alpha: "Opacity / half-life alpha",
  HalfLifeRank: "Half-life rank",
  EnergyTotal_keV: "Total mean energy keV",
  DecayVectorMagnitude: "Parent→daughter shift"
};

const presets = [
  ["Science", "Standard Chart (N vs Z)", "cartesian", "N", "Z", "flat", "source"],
  ["Science", "Rotated Chart (N=Z diagonal)", "rotated", "DiagPos", "DiagOff", "flat", "source"],
  ["Science", "Mass Landscape (Z vs A)", "cartesian", "Z", "A", "flat", "halfLife"],
  ["Science", "Neutron Excess (A vs N−Z)", "cartesian", "A", "N-Z", "flat", "source"],
  ["Science", "Proton Excess (A vs Z−N)", "cartesian", "A", "Z-N", "flat", "source"],
  ["Science", "N/Z Ratio by Mass", "cartesian", "A", "N/Z", "flat", "stability"],
  ["Science", "Daughter Map (D1Z vs D1N)", "cartesian", "Daughter1Z", "Daughter1N", "flat", "decay"],
  ["Science", "Decay Branch Landscape", "cartesian", "Z", "Decay1Percent", "NumBranches", "decay"],
  ["Science", "Gamma vs Beta-minus Energy", "cartesian", "MeanGammaEnergy_keV", "MeanBetaMinusEnergy_keV", "MeanBetaPlusECEnergy_keV", "decay"],
  ["Science", "Alpha Energy Rain", "cartesian", "MeanAlphaEnergy_keV", "Z", "A", "elementZone"],
  ["3D", "Half-life Terrain", "terrain", "N", "Z", "HalfLifeRank", "halfLife"],
  ["3D", "Energy Elevation", "energy", "N", "Z", "EnergyTotal_keV", "decay"],
  ["3D", "Daughter Displacement", "daughter", "N", "Z", "DecayVectorMagnitude", "decay"],
  ["Abstract", "Element Helix", "helix", "N", "Z", "A", "elementZone"],
  ["Abstract", "Hourglass (N−Z vs Z−N)", "cartesian", "N-Z", "Z-N", "A", "halfLife"],
  ["Abstract", "Decay Fanout", "cartesian", "Decay1Percent", "Decay2Percent", "NumBranches", "decay"]
];

const stabilityColors = { STABLE: "#c0c0c0", UNSTABLE: "#4da6ff" };
const halfLifeColors = {
  Stable: "#c0c0c0",
  VeryLong: "#8fd6ff",
  "Very Long": "#8fd6ff",
  Long: "#4da6ff",
  Medium: "#ffd166",
  Short: "#ff8a1f",
  VeryShort: "#e63946",
  "Very Short": "#e63946",
  Unknown: "#7b8494"
};
const decayColors = {
  Stable: "#c0c0c0", "B-": "#4da6ff", "2B-": "#7ec8ff", "B+": "#ff7e7e", "EC/B+": "#e63946", EC: "#a4243b",
  "EC/B+P": "#ff5733", "EC/P": "#ff8c1a", "EC/A": "#cc6600", P: "#ffa500", "2P": "#ffbf00", A: "#ffd700",
  "B-A": "#1a6b3d", "B-P": "#3d8ecc", "EC/B+A": "#b35900", SF: "#2ecc71", N: "#1a3399", "2N": "#0a1045", "B-N": "#2e6bd6", Unknown: "#7b8494"
};

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function cleanText(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return String(value);
}

function escapeHtml(value) {
  return cleanText(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function hexToRgba(hex, alpha) {
  const fallback = `rgba(85,85,85,${alpha ?? 0.65})`;
  if (!hex) return fallback;
  const clean = String(hex).replace("#", "").trim();
  if (clean.length !== 6) return fallback;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const a = Number.isFinite(Number(alpha)) ? Number(alpha) : 0.65;
  return `rgba(${r},${g},${b},${a})`;
}

function hexToRgbaSolid(hex, alpha = 0.82) { return hexToRgba(hex, alpha); }

function addDerivedFields(rows) {
  const halfRank = { Stable: 6, "Very Long": 5, VeryLong: 5, Long: 4, Medium: 3, Short: 2, "Very Short": 1, VeryShort: 1, Unknown: 0 };
  for (const r of rows) {
    r["Z-N"] = num(r.Z) !== null && num(r.N) !== null ? num(r.Z) - num(r.N) : null;
    r["N/Z"] = num(r.Z) > 0 ? num(r.N) / num(r.Z) : null;
    r.DiagPos = num(r.N) !== null && num(r.Z) !== null ? (num(r.N) + num(r.Z)) / Math.sqrt(2) : null;
    r.DiagOff = num(r.N) !== null && num(r.Z) !== null ? (num(r.N) - num(r.Z)) / Math.sqrt(2) : null;
    r.NumBranches = [r.Decay1Mode, r.Decay2Mode, r.Decay3Mode, r.Decay4Mode].filter(Boolean).length;
    r.HalfLifeRank = halfRank[r.HalfLifeBand] ?? 0;
    r.EnergyTotal_keV = [r.MeanGammaEnergy_keV, r.MeanBetaMinusEnergy_keV, r.MeanBetaPlusECEnergy_keV, r.MeanAlphaEnergy_keV, r.MeanNeutronEnergy_keV]
      .map(num).filter(v => v !== null).reduce((a, b) => a + b, 0) || null;
    const dz = num(r.Daughter1Z) !== null ? num(r.Daughter1Z) - num(r.Z) : 0;
    const dn = num(r.Daughter1N) !== null ? num(r.Daughter1N) - num(r.N) : 0;
    r.DecayVectorMagnitude = Math.sqrt(dz * dz + dn * dn) || null;
  }
}

function fillSelect(select, options) {
  select.innerHTML = "";
  for (const [value, label] of options) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  }
}

function fillPresetSelect() {
  presetSelect.innerHTML = "";
  let currentGroup = null;
  let groupEl = null;
  for (const p of presets) {
    if (p[0] !== currentGroup) {
      currentGroup = p[0];
      groupEl = document.createElement("optgroup");
      groupEl.label = p[0];
      presetSelect.appendChild(groupEl);
    }
    const opt = document.createElement("option");
    opt.value = p[1];
    opt.textContent = p[1];
    groupEl.appendChild(opt);
  }
}

function populateFilters(rows) {
  fillPresetSelect();
  const axisOptions = numericFields.map(f => [f, fieldLabels[f] || f]);
  fillSelect(xAxis, axisOptions.filter(([v]) => v !== "flat"));
  fillSelect(yAxis, axisOptions.filter(([v]) => v !== "flat"));
  fillSelect(zAxis, axisOptions);

  const modes = [...new Set(rows.map(r => r.Decay1Mode || (r.STABILITY === "STABLE" ? "Stable" : "Unknown")))].sort();
  for (const m of modes) {
    const opt = document.createElement("option"); opt.value = m; opt.textContent = m; decayFilter.appendChild(opt);
  }
  const bands = [...new Set(rows.map(r => r.HalfLifeBand || "Unknown"))].sort();
  for (const b of bands) {
    const opt = document.createElement("option"); opt.value = b; opt.textContent = b; halfLifeFilter.appendChild(opt);
  }

  xAxis.value = "N"; yAxis.value = "Z"; zAxis.value = "flat";
}

function getAxisValue(r, field) {
  if (field === "flat") return 0;
  const v = num(r[field]);
  return v === null ? null : v;
}

function normalize(values, scale = 18) {
  const valid = values.filter(v => Number.isFinite(v));
  if (!valid.length) return values.map(() => 0);
  const min = Math.min(...valid), max = Math.max(...valid);
  if (max === min) return values.map(v => Number.isFinite(v) ? 0 : null);
  return values.map(v => Number.isFinite(v) ? ((v - min) / (max - min) - 0.5) * scale : null);
}

function getCoordinates(rows) {
  const geom = geometryMode.value;
  if (geom === "helix") {
    return rows.map(r => {
      const z = num(r.Z) ?? 0;
      const n = num(r.N) ?? 0;
      const a = num(r.A) ?? 0;
      const theta = z * 0.42;
      const radius = 6 + Math.sqrt(Math.max(n, 0)) * 2.25;
      return { x: radius * Math.cos(theta), y: radius * Math.sin(theta), z: a / 3 };
    });
  }

  if (geom === "rotated") {
    return rows.map(r => ({ x: getAxisValue(r, "DiagPos"), y: getAxisValue(r, "DiagOff"), z: getAxisValue(r, zAxis.value) }));
  }

  if (geom === "terrain") {
    return rows.map(r => ({ x: num(r.N), y: num(r.Z), z: (num(r.HalfLifeRank) ?? 0) * 7 }));
  }

  if (geom === "energy") {
    const raw = rows.map(r => num(r.EnergyTotal_keV));
    const zvals = normalize(raw, 36);
    return rows.map((r, i) => ({ x: num(r.N), y: num(r.Z), z: zvals[i] }));
  }

  if (geom === "daughter") {
    return rows.map(r => ({ x: num(r.N), y: num(r.Z), z: (num(r.DecayVectorMagnitude) ?? 0) * 8 }));
  }

  const rawZ = rows.map(r => getAxisValue(r, zAxis.value));
  const zvals = zAxis.value === "flat" ? rawZ : normalize(rawZ, 42);
  return rows.map((r, i) => ({ x: getAxisValue(r, xAxis.value), y: getAxisValue(r, yAxis.value), z: zvals[i] }));
}

function getColor(r) {
  if (colorMode.value === "source") return hexToRgba(r.BaseColorHex, r.Alpha);
  if (colorMode.value === "stability") return hexToRgbaSolid(stabilityColors[r.STABILITY] || "#7b8494", r.Alpha ?? 0.75);
  if (colorMode.value === "halfLife") return hexToRgbaSolid(halfLifeColors[r.HalfLifeBand] || "#7b8494", r.Alpha ?? 0.75);
  if (colorMode.value === "decay") return hexToRgbaSolid(decayColors[r.Decay1Mode] || decayColors.Unknown, r.Alpha ?? 0.75);
  if (colorMode.value === "elementZone") {
    const z = num(r.Z) ?? 0;
    if (z <= 2) return hexToRgbaSolid("#8fd6ff", r.Alpha ?? 0.75);
    if (z <= 20) return hexToRgbaSolid("#4da6ff", r.Alpha ?? 0.75);
    if (z <= 56) return hexToRgbaSolid("#ffd166", r.Alpha ?? 0.75);
    if (z <= 82) return hexToRgbaSolid("#ff8a1f", r.Alpha ?? 0.75);
    return hexToRgbaSolid("#e63946", r.Alpha ?? 0.75);
  }
  return hexToRgba(r.BaseColorHex, r.Alpha);
}

function getSize(r) {
  if (sizeMode.value === "fixed") return r.STABILITY === "STABLE" ? 4.6 : 3.2;
  if (sizeMode.value === "branchCount") return 3 + (num(r.NumBranches) ?? 0) * 1.2;
  if (sizeMode.value === "halfLife") return 2.5 + (num(r.HalfLifeRank) ?? 0) * 0.75;
  if (sizeMode.value === "gamma") return 2.5 + Math.min(6, Math.sqrt(num(r.MeanGammaEnergy_keV) ?? 0) / 12);
  if (sizeMode.value === "decayPercent") return 2.5 + Math.min(5.5, (num(r.Decay1Percent) ?? 0) / 20);
  return 3.2;
}

function getFilteredRows() {
  const query = searchBox.value.trim().toLowerCase();
  const stab = stabilityFilter.value;
  const decay = decayFilter.value;
  const band = halfLifeFilter.value;
  const zlo = zMin.value === "" ? null : Number(zMin.value);
  const zhi = zMax.value === "" ? null : Number(zMax.value);
  const alo = aMin.value === "" ? null : Number(aMin.value);
  const ahi = aMax.value === "" ? null : Number(aMax.value);

  return allNuclides.filter(n => {
    if (stab !== "ALL" && n.STABILITY !== stab) return false;
    const d = n.Decay1Mode || (n.STABILITY === "STABLE" ? "Stable" : "Unknown");
    if (decay !== "ALL" && d !== decay) return false;
    if (band !== "ALL" && (n.HalfLifeBand || "Unknown") !== band) return false;
    if (zlo !== null && num(n.Z) < zlo) return false;
    if (zhi !== null && num(n.Z) > zhi) return false;
    if (alo !== null && num(n.A) < alo) return false;
    if (ahi !== null && num(n.A) > ahi) return false;
    if (query) {
      const haystack = [n.SYMBOL, n.NAME, n.Z, n.N, n.A, n.Decay1Mode, n.Decay2Mode, n.HalfLifeBand, n.STABILITY, n.Jpi]
        .map(cleanText).join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function buildHover(n) {
  const halfLife = `${cleanText(n["T1/2"])} ${cleanText(n["T1/2unit"])}`.trim() || "unknown";
  const decay = cleanText(n.Decay1Mode) || (n.STABILITY === "STABLE" ? "Stable" : "Unknown");
  const daughter = cleanText(n.Daughter1Symbol);
  return `<b>${escapeHtml(n.SYMBOL)}</b> (${escapeHtml(n.NAME)})<br>` +
    `Z=${n.Z} &nbsp; N=${n.N} &nbsp; A=${n.A}<br>` +
    `Stability: ${escapeHtml(n.STABILITY)}<br>` +
    `Jπ: ${escapeHtml(n.Jpi)}<br>` +
    `t½: ${escapeHtml(halfLife)}<br>` +
    `Decay: ${escapeHtml(decay)}${daughter ? " → " + escapeHtml(daughter) : ""}`;
}

function splitRows(rows, coords) {
  const stable = [], unstable = [];
  rows.forEach((r, i) => {
    const c = coords[i];
    if (![c.x, c.y, c.z].every(Number.isFinite)) return;
    const pack = { r, c };
    if (r.STABILITY === "STABLE") stable.push(pack); else unstable.push(pack);
  });
  return { stable, unstable };
}

function traceFromPack(pack, name, symbol) {
  return {
    type: "scatter3d",
    mode: "markers",
    name,
    x: pack.map(p => p.c.x),
    y: pack.map(p => p.c.y),
    z: pack.map(p => p.c.z),
    text: pack.map(p => buildHover(p.r)),
    customdata: pack.map(p => p.r.SYMBOL),
    hoverinfo: "text",
    marker: {
      size: pack.map(p => getSize(p.r)),
      symbol,
      color: pack.map(p => getColor(p.r)),
      line: { width: 0 }
    }
  };
}

function makeDecayLineTrace(rows, coordMap) {
  if (showLines.value === "off") return null;
  const xs = [], ys = [], zs = [], texts = [];
  let count = 0;
  const maxLines = 650;
  for (const r of rows) {
    if (count >= maxLines) break;
    if (!r.Daughter1Symbol || !coordMap.has(r.SYMBOL) || !coordMap.has(r.Daughter1Symbol)) continue;
    const a = coordMap.get(r.SYMBOL), b = coordMap.get(r.Daughter1Symbol);
    xs.push(a.x, b.x, null); ys.push(a.y, b.y, null); zs.push(a.z, b.z, null);
    texts.push(`${r.SYMBOL} → ${r.Daughter1Symbol}`, `${r.SYMBOL} → ${r.Daughter1Symbol}`, "");
    count++;
  }
  if (!count) return null;
  return {
    type: "scatter3d", mode: "lines", name: `Daughter links (${count})`, x: xs, y: ys, z: zs, text: texts, hoverinfo: "text",
    line: { color: "rgba(255,106,26,0.28)", width: 2 }
  };
}

function axisTitle(field, fallback) {
  if (geometryMode.value === "helix") return fallback;
  if (geometryMode.value === "terrain") return fallback;
  if (geometryMode.value === "energy") return fallback;
  if (geometryMode.value === "daughter") return fallback;
  if (geometryMode.value === "rotated" && field === "x") return fieldLabels.DiagPos;
  if (geometryMode.value === "rotated" && field === "y") return fieldLabels.DiagOff;
  return fieldLabels[field] || field;
}

function isPortraitInstrumentMode() {
  return window.matchMedia && window.matchMedia("(orientation: portrait) and (min-width: 900px)").matches;
}

function getCamera(mode = "top") {
  if (mode === "iso") return { eye: { x: 1.45, y: 1.45, z: 1.2 }, up: { x: 0, y: 1, z: 0 }, center: { x: 0, y: 0, z: 0 } };
  if (mode === "side") return { eye: { x: 2.2, y: 0, z: 0.45 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0 } };

  if (isPortraitInstrumentMode()) {
    return {
      eye: { x: 0, y: 0, z: 2.32 },
      up: { x: 0, y: 1, z: 0 },
      center: { x: -0.08, y: -0.06, z: 0 }
    };
  }

  return { eye: { x: 0, y: 0, z: 2.7 }, up: { x: 0, y: 1, z: 0 }, center: { x: 0, y: 0, z: 0 } };
}


function renderSources() {
  if (!sourcesContent) return;

  const primary = sourceManifest?.primarySources?.[0];
  const additional = sourceManifest?.primarySources?.[1];

  sourcesContent.innerHTML = `
    <div class="source-block">
      <div class="source-title">${escapeHtml(primary?.name || "JENDL-5")}</div>
      <div class="source-line">${escapeHtml(primary?.fullName || "Japanese Evaluated Nuclear Data Library version 5")}</div>
      <div class="source-line">${escapeHtml(primary?.organization || "Japan Atomic Energy Agency / Nuclear Data Center")}</div>
      <div class="source-line"><b>DOI:</b> ${escapeHtml(primary?.doi || "10.1080/00223131.2022.2141903")}</div>
    </div>

    <div class="source-block">
      <div class="source-title">${escapeHtml(additional?.name || "Additional source")}</div>
      <div class="source-line">${escapeHtml(additional?.formalCitation || "Pending confirmation")}</div>
    </div>

    <div class="science-note">${escapeHtml(sourceManifest?.normalizationNote || "Dataset normalized for public visualization.")}</div>
    <div class="science-note warning-note">${escapeHtml(sourceManifest?.authorityNote || "Use official evaluated nuclear-data libraries for authoritative work.")}</div>
  `;
}
function renderLegend() {
  const mode = colorMode.value;
  let items = [];
  if (mode === "stability") items = Object.entries(stabilityColors);
  else if (mode === "halfLife") items = Object.entries(halfLifeColors);
  else if (mode === "decay") items = Object.entries(decayColors);
  else if (mode === "elementZone") items = [["Z 0–2", "#8fd6ff"], ["Z 3–20", "#4da6ff"], ["Z 21–56", "#ffd166"], ["Z 57–82", "#ff8a1f"], ["Z 83+", "#e63946"]];
  else items = [["Source CSV BaseColorHex + Alpha", "#4da6ff"], ["Stable spheres", "#c0c0c0"], ["Unstable cubes", "#3d7ec0"]];

  legendContent.innerHTML = items.slice(0, 22).map(([label, color]) => `<div class="legend-row"><span class="swatch" style="background:${color}"></span><span>${escapeHtml(label)}</span></div>`).join("") +
    `<div class="legend-muted">Marker opacity follows the half-life alpha field when available. Decay lines are capped for performance.</div>`;
}

function updateOrientation() {
  const geom = geometryMode.value;
  if (geom === "helix") {
    orientationX.textContent = "element spiral X"; orientationY.textContent = "element spiral Y"; orientationZ.textContent = "mass/elevation";
    orientationNote.textContent = "Abstract view: proton number winds the lattice into a helix while neutron count controls radius."; return;
  }
  if (geom === "terrain") {
    orientationX.textContent = "N"; orientationY.textContent = "Z"; orientationZ.textContent = "half-life rank";
    orientationNote.textContent = "Terrain view: the normal chart is raised by half-life band."; return;
  }
  if (geom === "energy") {
    orientationX.textContent = "N"; orientationY.textContent = "Z"; orientationZ.textContent = "total mean energy";
    orientationNote.textContent = "Energy view: known mean radiation energies raise points out of the chart plane."; return;
  }
  if (geom === "daughter") {
    orientationX.textContent = "N"; orientationY.textContent = "Z"; orientationZ.textContent = "parent→daughter shift";
    orientationNote.textContent = "Daughter view: height reflects first-daughter displacement from the parent nuclide."; return;
  }
  if (geom === "rotated") {
    orientationX.textContent = "Diag∥ along N=Z"; orientationY.textContent = "Diag⊥ neutron offset"; orientationZ.textContent = fieldLabels[zAxis.value] || zAxis.value;
    orientationNote.textContent = "Rotated view straightens the N=Z diagonal into a primary axis."; return;
  }
  orientationX.textContent = fieldLabels[xAxis.value] || xAxis.value;
  orientationY.textContent = fieldLabels[yAxis.value] || yAxis.value;
  orientationZ.textContent = fieldLabels[zAxis.value] || zAxis.value;
  orientationNote.textContent = "Cartesian mode maps selected numeric fields directly into X/Y/Z.";
}

function dash(value) {
  if (value === null || value === undefined || value === "" || String(value).toLowerCase() === "nan") return "—";
  return String(value);
}

function hasValue(value) {
  return !(value === null || value === undefined || value === "" || String(value).toLowerCase() === "nan");
}

function isotopeKey(n) {
  return `${dash(n.SYMBOL)} · Z${dash(n.Z)} N${dash(n.N)} A${dash(n.A)}`;
}

function describeHalfLifeBand(band) {
  const b = cleanText(band);
  const notes = {
    "Stable": "Stable or effectively stable in this dataset.",
    "VeryShort": "Very short-lived nuclide; useful for seeing fast decay regions and drip-line behavior.",
    "Short": "Short-lived nuclide; often relevant to activation, decay chains, and laboratory production.",
    "Medium": "Intermediate half-life range; often visible in applied decay-chain and environmental contexts.",
    "Long": "Long-lived radionuclide; important for persistence, dating, waste, and long-term inventory thinking.",
    "VeryLong": "Extremely persistent radionuclide; geological and long-duration system relevance.",
    "Unknown": "Half-life band is not classified in the current visual schema."
  };
  return notes[b] || "Half-life band from the current visual schema.";
}

function formatHalfLife(n) {
  const v = dash(n["T1/2"]);
  const u = dash(n["T1/2unit"]);
  if (v === "—" && u === "—") return "unknown";
  if (u === "—") return v;
  return `${v} ${u}`;
}

function formatPercent(value) {
  if (!hasValue(value)) return "";
  return ` (${escapeHtml(value)}%)`;
}

function findNuclide(symbol) {
  if (!symbol) return null;
  const target = String(symbol).trim().toLowerCase();
  return allNuclides.find(r => String(r.SYMBOL).trim().toLowerCase() === target) || null;
}

function decayBranch(n, index) {
  const mode = n[`Decay${index}Mode`];
  const pct = n[`Decay${index}Percent`];
  const daughter = n[`Daughter${index}Symbol`];
  const dz = n[`Daughter${index}Z`];
  const dn = n[`Daughter${index}N`];
  const da = n[`Daughter${index}A`];

  if (!hasValue(mode) && !hasValue(daughter) && !hasValue(pct)) return "";

  const daughterExists = findNuclide(daughter);
  const daughterButton = hasValue(daughter)
    ? `<button class="daughter-jump" data-symbol="${escapeHtml(daughter)}" ${daughterExists ? "" : "disabled"}>${escapeHtml(daughter)}</button>`
    : `<span class="muted">—</span>`;

  const coords = hasValue(daughter)
    ? `<span class="branch-coords">Z=${escapeHtml(dash(dz))} · N=${escapeHtml(dash(dn))} · A=${escapeHtml(dash(da))}</span>`
    : "";

  return `
    <div class="decay-branch">
      <div class="branch-mode">${escapeHtml(dash(mode))}${formatPercent(pct)}</div>
      <div class="branch-arrow">→</div>
      <div class="branch-daughter">${daughterButton}${coords}</div>
    </div>
  `;
}

function renderEnergyTable(n) {
  const energies = [
    ["γ gamma", n.MeanGammaEnergy_keV],
    ["β− beta minus", n.MeanBetaMinusEnergy_keV],
    ["β+ / EC", n.MeanBetaPlusECEnergy_keV],
    ["α alpha", n.MeanAlphaEnergy_keV],
    ["n neutron", n.MeanNeutronEnergy_keV]
  ];

  return `
    <div class="energy-grid">
      ${energies.map(([label, value]) => `
        <div class="energy-cell">
          <span>${escapeHtml(label)}</span>
          <b>${escapeHtml(dash(value))}${hasValue(value) ? " keV" : ""}</b>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSelection(symbol) {
  const n = allNuclides.find(r => r.SYMBOL === symbol);
  if (!n) return;

  const halfLife = formatHalfLife(n);
  const branches = [1, 2, 3, 4].map(i => decayBranch(n, i)).filter(Boolean).join("");
  const dataStamp = manifest?.generatedUtc ? new Date(manifest.generatedUtc).toLocaleString() : "unknown";
  const provenanceNote = sourceManifest?.primarySources?.[0]
    ? `${sourceManifest.primarySources[0].name} / ${sourceManifest.primarySources[0].organization}`
    : "Source manifest not loaded";

  const sourceNote = manifest
    ? `${escapeHtml(manifest.releaseLabel || "public export")} · ${escapeHtml(manifest.rowCount || allNuclides.length)} rows · generated ${escapeHtml(dataStamp)}`
    : `${allNuclides.length} rows loaded`;

  selectedNuclide.innerHTML = `
    <div class="nuclide-title">${escapeHtml(n.SYMBOL)}</div>
    <div class="nuclide-subtitle">${escapeHtml(n.NAME)}</div>

    <div class="nuclide-grid">
      <div class="nuclide-stat"><span>Z proton</span><b>${escapeHtml(n.Z)}</b></div>
      <div class="nuclide-stat"><span>N neutron</span><b>${escapeHtml(n.N)}</b></div>
      <div class="nuclide-stat"><span>A mass</span><b>${escapeHtml(n.A)}</b></div>
    </div>

    <div class="science-section">
      <h4>Identity</h4>
      <div class="detail-line"><b>Key:</b> ${escapeHtml(isotopeKey(n))}</div>
      <div class="detail-line"><b>N − Z:</b> ${escapeHtml(dash(n["N-Z"]))}</div>
      <div class="detail-line"><b>Spin/parity Jπ:</b> ${escapeHtml(dash(n.Jpi))}</div>
    </div>

    <div class="science-section">
      <h4>Stability and half-life</h4>
      <div class="detail-line"><b>Status:</b> ${escapeHtml(dash(n.STABILITY))}</div>
      <div class="detail-line"><b>Half-life:</b> ${escapeHtml(halfLife)}</div>
      <div class="detail-line"><b>Band:</b> ${escapeHtml(dash(n.HalfLifeBand))}</div>
      <div class="science-note">${escapeHtml(describeHalfLifeBand(n.HalfLifeBand))}</div>
    </div>

    <div class="science-section">
      <h4>Decay branches</h4>
      ${branches || `<div class="detail-line muted">No decay branch listed in the public dataset.</div>`}
    </div>

    <div class="science-section">
      <h4>Mean emitted energy</h4>
      ${renderEnergyTable(n)}
    </div>

    <div class="science-section">
      <h4>Visual encoding</h4>
      <div class="detail-line"><b>Base color:</b> <span class="inline-swatch" style="background:${escapeHtml(n.BaseColorHex || "#555")}"></span>${escapeHtml(dash(n.BaseColorHex))}</div>
      <div class="detail-line"><b>Decay line color:</b> <span class="inline-swatch" style="background:${escapeHtml(n.Decay1LineColorHex || "#555")}"></span>${escapeHtml(dash(n.Decay1LineColorHex))}</div>
      <div class="detail-line"><b>Shape:</b> ${escapeHtml(dash(n.Shape))} · <b>Alpha:</b> ${escapeHtml(dash(n.Alpha))}</div>
    </div>

    <div class="science-section data-source-section">
      <h4>Data source</h4>
      <div class="science-note">${sourceNote}</div>
      <div class="science-note">Static public viewer. Data is loaded from external JSON, not embedded as a giant HTML database.</div>
      <div class="science-note"><b>Primary source credit:</b> ${escapeHtml(provenanceNote)}</div>
    </div>
  `;

  selectedNuclide.querySelectorAll(".daughter-jump").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-symbol");
      if (!target) return;
      searchBox.value = target;
      renderChart(lastCamera || getCamera("top"));
      renderSelection(target);
    });
  });
}

function renderChart(cameraOverride = null) {
  const rows = getFilteredRows();
  const coords = getCoordinates(rows);
  const { stable, unstable } = splitRows(rows, coords);

  const coordMap = new Map();
  rows.forEach((r, i) => { const c = coords[i]; if ([c.x, c.y, c.z].every(Number.isFinite)) coordMap.set(r.SYMBOL, c); });

  const traces = [traceFromPack(stable, "Stable", "circle"), traceFromPack(unstable, "Unstable", "square")];
  const lineTrace = makeDecayLineTrace(rows, coordMap);
  if (lineTrace) traces.push(lineTrace);

  const camera = cameraOverride || lastCamera || getCamera("top");
  const zTitle = geometryMode.value === "cartesian" ? fieldLabels[zAxis.value] : "Derived depth";

  const layout = {
    paper_bgcolor: "#05070b", plot_bgcolor: "#05070b", margin: { l: 0, r: 0, t: 0, b: 0 },
    scene: {
      bgcolor: "#05070b",
      xaxis: { title: axisTitle(xAxis.value, "X"), backgroundcolor: "#05070b", gridcolor: "#18202d", color: "#ccd4df", zerolinecolor: "#273142" },
      yaxis: { title: axisTitle(yAxis.value, "Y"), backgroundcolor: "#05070b", gridcolor: "#18202d", color: "#ccd4df", zerolinecolor: "#273142" },
      zaxis: { title: zTitle, backgroundcolor: "#05070b", gridcolor: "#10151e", color: "#8b96a8", zerolinecolor: "#273142", showticklabels: zAxis.value !== "flat" || geometryMode.value !== "cartesian" },
      camera,
      aspectmode: geometryMode.value === "cartesian" && zAxis.value === "flat" ? "manual" : "cube",
      aspectratio: geometryMode.value === "cartesian" && zAxis.value === "flat"
        ? (isPortraitInstrumentMode() ? { x: 1.72, y: 1.14, z: 0.06 } : { x: 1.55, y: 1, z: 0.08 })
        : undefined
    },
    legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.55)", bordercolor: "#263040", borderwidth: 1, font: { color: "#d8dde6" } },
    hoverlabel: { bgcolor: "#111722", bordercolor: "#4da6ff", font: { color: "#eef4ff", family: "Consolas, monospace" } },
    dragmode: "orbit"
  };

  Plotly.react(chartEl, traces, layout, { responsive: true, displaylogo: false, scrollZoom: true });
  chartEl.on("plotly_relayout", ev => { if (ev && ev["scene.camera"]) lastCamera = ev["scene.camera"]; });
  chartEl.on("plotly_click", ev => { const symbol = ev?.points?.[0]?.customdata; if (symbol) renderSelection(symbol); });

  const manifestText = manifest ? `${manifest.rowCount.toLocaleString()} rows · ${manifest.fieldCount} fields · ${manifest.releaseLabel}` : `${allNuclides.length.toLocaleString()} rows`;
  const usable = stable.length + unstable.length;
  statusEl.textContent = `${usable.toLocaleString()} plotted / ${rows.length.toLocaleString()} filtered / ${manifestText}`;
  updateOrientation();
  renderLegend();
}

function applyPreset(name) {
  const p = presets.find(item => item[1] === name);
  if (!p) return;
  geometryMode.value = p[2]; xAxis.value = p[3]; yAxis.value = p[4]; zAxis.value = p[5]; colorMode.value = p[6];
  lastCamera = geometryMode.value === "cartesian" && zAxis.value === "flat" ? getCamera("top") : getCamera("iso");
  renderChart(lastCamera);
}

function resetFilters() {
  searchBox.value = ""; stabilityFilter.value = "ALL"; decayFilter.value = "ALL"; halfLifeFilter.value = "ALL";
  zMin.value = ""; zMax.value = ""; aMin.value = ""; aMax.value = "";
  presetSelect.value = "Standard Chart (N vs Z)";
  geometryMode.value = "cartesian"; colorMode.value = "source"; sizeMode.value = "fixed"; showLines.value = "off";
  xAxis.value = "N"; yAxis.value = "Z"; zAxis.value = "flat"; lastCamera = getCamera("top");
  renderChart(lastCamera);
}

async function boot() {
  statusEl.textContent = "Loading external JSON data…";
  const [manifestResponse, dataResponse, sourceResponse] = await Promise.all([fetch(MANIFEST_URL), fetch(DATA_URL), fetch(SOURCE_MANIFEST_URL)]);
  if (!manifestResponse.ok) throw new Error(`Manifest load failed: ${manifestResponse.status}`);
  if (!dataResponse.ok) throw new Error(`Data load failed: ${dataResponse.status}`);
  manifest = await manifestResponse.json();
  allNuclides = await dataResponse.json();
  sourceManifest = sourceResponse.ok ? await sourceResponse.json() : null;
  renderSources();
  addDerivedFields(allNuclides);
  populateFilters(allNuclides);
  resetFilters();
}

[searchBox, stabilityFilter, decayFilter, halfLifeFilter, zMin, zMax, aMin, aMax, xAxis, yAxis, zAxis, geometryMode, colorMode, sizeMode, showLines]
  .forEach(el => el.addEventListener("input", () => renderChart()));
[stabilityFilter, decayFilter, halfLifeFilter, xAxis, yAxis, zAxis, geometryMode, colorMode, sizeMode, showLines]
  .forEach(el => el.addEventListener("change", () => renderChart()));

presetSelect.addEventListener("change", () => applyPreset(presetSelect.value));
resetFiltersBtn.addEventListener("click", resetFilters);
cameraTopBtn.addEventListener("click", () => { lastCamera = getCamera("top"); renderChart(lastCamera); });
cameraIsoBtn.addEventListener("click", () => { lastCamera = getCamera("iso"); renderChart(lastCamera); });
cameraSideBtn.addEventListener("click", () => { lastCamera = getCamera("side"); renderChart(lastCamera); });

window.addEventListener("resize", () => {
  if (!lastCamera) renderChart(getCamera("top"));
});

boot().catch(err => { console.error(err); statusEl.textContent = `Load error: ${err.message}`; });
