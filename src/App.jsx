import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Fuel, ArrowRightLeft, Loader2, Save, History, Trash2, Plus, Minus,
  Navigation, MapPin, Gauge, Euro, Map as MapIcon, X
} from "lucide-react";

const FUEL_TYPES = ["Benzina", "Diesel", "GPL", "Metano"];
const SETTINGS_KEY = "fuel-calc:settings";
const HISTORY_KEY = "fuel-calc:history";
const PISA_COORDS = { lat: 43.7228, lng: 10.4017 };
const AREZZO_COORDS = { lat: 43.4633, lng: 11.8796 };

const DEFAULT_SETTINGS = {
  vehicleName: "Mazda 2 (2007)",
  fuelType: "Benzina",
  consumption: 14,
  consumptionUnit: "kml",
  from: "Pisa",
  to: "Arezzo",
  distanceKm: 157,
  roundTrip: false,
  trips: 1,
  pricePerLiter: 1.75,
  fromCoords: null,
  toCoords: null,
};

const styles = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

.fuel-calc-app {
  --bg: #0f1319;
  --panel: #171d26;
  --panel-raised: #1d2531;
  --border: #2a3341;
  --amber: #ff9640;
  --amber-soft: rgba(255,150,64,0.16);
  --amber-glow: rgba(255,150,64,0.35);
  --teal: #48d6c8;
  --text-1: #eaf0f6;
  --text-2: #8a97a8;
  --text-3: #5b6577;
  --danger: #ff6b6b;
  --radius: 18px;
  font-family: 'IBM Plex Sans', -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text-1);
  padding: 20px 14px 40px;
  min-height: 100%;
  box-sizing: border-box;
}
.fuel-calc-app *, .fuel-calc-app *::before, .fuel-calc-app *::after { box-sizing: border-box; }
.app-shell { max-width: 420px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }

.app-header { display: flex; align-items: center; gap: 12px; padding: 4px 2px 6px; }
.badge {
  width: 44px; height: 44px; border-radius: 14px;
  background: linear-gradient(155deg, var(--panel-raised), var(--panel));
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  color: var(--amber);
  box-shadow: 0 0 0 1px rgba(255,150,64,0.08), 0 6px 16px -8px var(--amber-glow);
  flex-shrink: 0;
}
.eyebrow { margin: 0; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-3); font-weight: 600; }
.app-header h1 { margin: 2px 0 0; font-size: 21px; font-weight: 700; letter-spacing: -0.01em; }

.pod { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.pod-label { margin: 0; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); font-weight: 600; display: flex; align-items: center; gap: 6px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field span { font-size: 12.5px; color: var(--text-2); font-weight: 500; }
.field input, .price-input { background: var(--panel-raised); border: 1px solid var(--border); border-radius: 10px; padding: 11px 12px; color: var(--text-1); font-family: 'IBM Plex Mono', monospace; font-size: 15px; width: 100%; transition: border-color .15s ease; }
.field input:focus-visible, .price-input:focus-within { outline: none; border-color: var(--teal); }

.row { display: flex; gap: 10px; }
.row.two-col > * { flex: 1; min-width: 0; }
.segmented { display: flex; flex-wrap: wrap; gap: 6px; }
.segmented button { flex: 1 1 auto; min-width: 72px; background: var(--panel-raised); border: 1px solid var(--border); color: var(--text-2); padding: 9px 8px; border-radius: 10px; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; }
.segmented button.active { background: var(--amber-soft); border-color: var(--amber); color: var(--amber); }

.unit-toggle { display: flex; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--panel-raised); align-self: flex-end; }
.unit-toggle button { background: transparent; border: none; color: var(--text-2); padding: 11px 10px; font-size: 12px; font-weight: 600; cursor: pointer; }
.unit-toggle button.active { background: var(--amber-soft); color: var(--amber); }

.route-stack { display: flex; flex-direction: column; gap: 4px; }
.swap-btn { align-self: center; width: 34px; height: 34px; border-radius: 50%; background: var(--panel-raised); border: 1px solid var(--border); color: var(--teal); display: flex; align-items: center; justify-content: center; cursor: pointer; margin: -6px 0; z-index: 1; }

.btn-primary { display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(155deg, #ffab5e, var(--amber)); border: none; color: #1a1004; font-family: 'IBM Plex Sans', sans-serif; font-weight: 700; font-size: 14px; padding: 13px; border-radius: 12px; cursor: pointer; box-shadow: 0 6px 20px -8px var(--amber-glow); }
.btn-primary:disabled { opacity: 0.55; cursor: default; box-shadow: none; }
.link-btn { background: none; border: none; color: var(--text-3); font-size: 12px; text-decoration: underline; cursor: pointer; padding: 0; }

.hint { margin: 0; font-size: 12px; color: var(--text-3); }
.hint.error { color: var(--danger); }
.hint.success { color: var(--teal); }

.row.toggles { align-items: center; justify-content: space-between; flex-wrap: wrap; }
.switch-field { display: flex; align-items: center; gap: 10px; }
.switch { position: relative; display: inline-block; width: 40px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.switch-thumb { position: absolute; inset: 0; background: var(--panel-raised); border: 1px solid var(--border); border-radius: 999px; cursor: pointer; }
.switch-thumb::before { content: ""; position: absolute; width: 16px; height: 16px; left: 3px; top: 2.5px; background: var(--text-2); border-radius: 50%; transition: transform .2s ease, background .2s ease; }
.switch input:checked + .switch-thumb { background: var(--amber-soft); border-color: var(--amber); }
.switch input:checked + .switch-thumb::before { transform: translateX(16px); background: var(--amber); }

.stepper { display: flex; align-items: center; gap: 8px; }
.stepper-controls { display: flex; align-items: center; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.stepper-controls button { background: var(--panel-raised); border: none; color: var(--text-1); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.stepper-controls span { width: 26px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 13px; }

.price-input { display: flex; align-items: center; gap: 6px; }
.price-input input { border: none; background: none; padding: 0; flex: 1; }
.tick-divider { height: 8px; margin: -2px 6px 0; background-image: repeating-linear-gradient(90deg, var(--amber) 0px, var(--amber) 1px, transparent 1px, transparent 9px); opacity: 0.3; }

.result-pod { align-items: center; text-align: center; background: linear-gradient(180deg, var(--panel), #141a22); }
.odometer { font-family: 'IBM Plex Mono', monospace; font-size: 38px; font-weight: 600; color: var(--amber); text-shadow: 0 0 22px var(--amber-glow); }
.sub-readouts { display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; padding: 4px 0 6px; }
.sub-readouts > div { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.sub-readouts span { font-size: 10.5px; text-transform: uppercase; color: var(--text-3); }
.sub-readouts strong { font-family: 'IBM Plex Mono', monospace; font-size: 15px; color: var(--text-1); font-weight: 600; }

.history-pod { gap: 8px; }
.history-head { display: flex; align-items: center; justify-content: space-between; }
.history-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; max-height: 220px; overflow-y: auto; }
.history-list li { display: flex; align-items: center; justify-content: space-between; padding: 9px 10px; background: var(--panel-raised); border-radius: 10px; border: 1px solid var(--border); gap: 8px; }
.history-cost { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.history-cost span { font-family: 'IBM Plex Mono', monospace; font-weight: 600; color: var(--teal); font-size: 13.5px; }
.history-cost button { background: none; border: none; color: var(--text-3); cursor: pointer; }
.spin { animation: fc-spin 0.9s linear infinite; }
@keyframes fc-spin { to { transform: rotate(360deg); } }
`;

function fmtEuro(n) { return (isFinite(n) ? n : 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }
function fmtNum(n, d) { return (isFinite(n) ? n : 0).toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d }); }

// Ricerca Nominatim
const searchAddress = async (query) => {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=it`);
    const data = await res.json();
    return data.map(item => ({ name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) }));
  } catch (e) { return []; }
};

function AddressInput({ value, onChange, placeholder, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);

  const handleInput = (e) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 3) return setSuggestions([]);
    
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddress(val);
      setSuggestions(results);
    }, 600);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input value={value} onChange={handleInput} placeholder={placeholder} />
      {suggestions.length > 0 && (
        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--panel-raised)', border: '1px solid var(--border)', borderRadius: '8px', zIndex: 10, padding: 0, margin: '4px 0', listStyle: 'none', maxHeight: '200px', overflowY: 'auto' }}>
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => { onSelect(s); setSuggestions([]); }} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-1)' }}>
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CalcolatoreCostoBenzina() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceError, setDistanceError] = useState("");
  const [distanceSource, setDistanceSource] = useState(null);

  const updateSettings = (patch) => setSettings((s) => ({ ...s, ...patch }));

  // FIX: Lettura e Salvataggio corretti tramite localStorage standard web
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) setSettings(s => ({ ...s, ...JSON.parse(savedSettings) }));
      
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch(e) {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch(e){}
    }, 500);
    return () => clearTimeout(t);
  }, [settings, loaded]);

  const toggleConsumptionUnit = () => {
    setSettings((s) => {
      const newUnit = s.consumptionUnit === "kml" ? "l100" : "kml";
      const current = Number(s.consumption);
      const converted = current > 0 ? Math.round((100 / current) * 100) / 100 : s.consumption;
      return { ...s, consumptionUnit: newUnit, consumption: converted };
    });
  };

  const swapRoute = () => updateSettings({ from: settings.to, to: settings.from, fromCoords: settings.toCoords, toCoords: settings.fromCoords });
  const incTrips = () => updateSettings({ trips: Math.min(60, (Number(settings.trips) || 1) + 1) });
  const decTrips = () => updateSettings({ trips: Math.max(1, (Number(settings.trips) || 1) - 1) });

  const fetchDistance = async () => {
    if (!settings.fromCoords || !settings.toCoords) {
      setDistanceError("Seleziona gli indirizzi dai suggerimenti prima di calcolare.");
      return;
    }
    setDistanceLoading(true); setDistanceError(""); setDistanceSource(null);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${settings.fromCoords.lng},${settings.fromCoords.lat};${settings.toCoords.lng},${settings.toCoords.lat}?overview=false`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === "Ok" && data.routes.length > 0) {
        updateSettings({ distanceKm: Math.round(data.routes[0].distance / 100) / 10 });
        setDistanceSource("OSRM");
      } else throw new Error("Percorso non trovato");
    } catch (err) {
      setDistanceError("Errore calcolo percorso. Inserisci i km manualmente.");
    } finally {
      setDistanceLoading(false);
    }
  };

  const result = useMemo(() => {
    const totalKm = (Number(settings.distanceKm) || 0) * (settings.roundTrip ? 2 : 1) * (Number(settings.trips) || 1);
    const liters = settings.consumptionUnit === "kml" ? (settings.consumption > 0 ? totalKm / settings.consumption : 0) : (totalKm * settings.consumption) / 100;
    return { totalKm, liters, totalCost: liters * settings.pricePerLiter };
  }, [settings]);

  const saveToHistory = () => {
    const entry = { id: Date.now(), date: new Date().toISOString(), from: settings.from, to: settings.to, vehicle: settings.vehicleName, cost: result.totalCost };
    const next = [entry, ...history].slice(0, 15);
    setHistory(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch(e){}
  };

  const deleteHistoryItem = (id) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch(e){}
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch(e){}
  };

  return (
    <div className="fuel-calc-app">
      <style>{styles}</style>
      <div className="app-shell">
        <header className="app-header">
          <div className="badge"><Fuel size={20} /></div>
          <div>
            <p className="eyebrow">Cruscotto di viaggio</p>
            <h1>Costo benzina</h1>
          </div>
        </header>

        <section className="pod">
          <p className="pod-label"><Fuel size={13} /> Veicolo</p>
          <label className="field">
            <span>Nome veicolo</span>
            <input value={settings.vehicleName} onChange={(e) => updateSettings({ vehicleName: e.target.value })} placeholder="Es. Mazda 2" />
          </label>
          <div className="segmented">
            {FUEL_TYPES.map((ft) => (
              <button key={ft} type="button" className={settings.fuelType === ft ? "active" : ""} onClick={() => updateSettings({ fuelType: ft })}>{ft}</button>
            ))}
          </div>
          <div className="row two-col">
            <label className="field">
              <span>Consumo</span>
              <input type="number" inputMode="decimal" step="0.1" value={settings.consumption} onChange={(e) => updateSettings({ consumption: e.target.value })} />
            </label>
            <div className="unit-toggle">
              <button type="button" className={settings.consumptionUnit === "kml" ? "active" : ""} onClick={toggleConsumptionUnit}>km/L</button>
              <button type="button" className={settings.consumptionUnit === "l100" ? "active" : ""} onClick={toggleConsumptionUnit}>L/100km</button>
            </div>
          </div>
        </section>

        <section className="pod">
          <p className="pod-label"><MapPin size={13} /> Percorso</p>
          <div className="route-stack">
            <label className="field">
              <span>Partenza</span>
              <AddressInput 
                value={settings.from} 
                onChange={(v) => updateSettings({ from: v, fromCoords: null, distanceSource: null })} 
                onSelect={(s) => updateSettings({ from: s.name.split(',')[0], fromCoords: { lat: s.lat, lng: s.lng } })}
                placeholder="Cerca partenza..." 
              />
            </label>
            <button className="swap-btn" type="button" onClick={swapRoute}>
              <ArrowRightLeft size={16} style={{ transform: "rotate(90deg)" }} />
            </button>
            <label className="field">
              <span>Destinazione</span>
              <AddressInput 
                value={settings.to} 
                onChange={(v) => updateSettings({ to: v, toCoords: null, distanceSource: null })} 
                onSelect={(s) => updateSettings({ to: s.name.split(',')[0], toCoords: { lat: s.lat, lng: s.lng } })}
                placeholder="Cerca destinazione..." 
              />
            </label>
          </div>

          <button className="btn-primary" type="button" onClick={fetchDistance} disabled={distanceLoading || !settings.fromCoords || !settings.toCoords}>
            {distanceLoading ? <Loader2 size={16} className="spin" /> : <Navigation size={16} />}
            Calcola distanza
          </button>

          {distanceError && <p className="hint error">{distanceError}</p>}
          {distanceSource && <p className="hint success">Distanza calcolata via {distanceSource}</p>}

          <label className="field">
            <span>Distanza singola (km)</span>
            <input type="number" step="0.1" value={settings.distanceKm} onChange={(e) => updateSettings({ distanceKm: e.target.value })} />
          </label>

          <div className="row toggles">
            <label className="switch-field">
              <span>Andata e ritorno</span>
              <span className="switch">
                <input type="checkbox" checked={settings.roundTrip} onChange={(e) => updateSettings({ roundTrip: e.target.checked })} />
                <span className="switch-thumb" />
              </span>
            </label>
            <div className="stepper">
              <span>Viaggi</span>
              <div className="stepper-controls">
                <button type="button" onClick={decTrips}><Minus size={14} /></button>
                <span>{settings.trips}</span>
                <button type="button" onClick={incTrips}><Plus size={14} /></button>
              </div>
            </div>
          </div>
        </section>

        <section className="pod">
          <p className="pod-label"><Euro size={13} /> Prezzo carburante</p>
          <label className="field">
            <span>Prezzo al litro</span>
            <div className="price-input">
              <span>€</span>
              <input type="number" inputMode="decimal" step="0.01" value={settings.pricePerLiter} onChange={(e) => updateSettings({ pricePerLiter: e.target.value })} />
            </div>
          </label>
        </section>

        <div className="tick-divider" />

        <section className="pod result-pod">
          <p className="pod-label"><Gauge size={13} /> Costo stimato</p>
          <div className="odometer">{fmtEuro(result.totalCost)}</div>
          <div className="sub-readouts">
            <div><span>Distanza totale</span><strong>{fmtNum(result.totalKm, 1)} km</strong></div>
            <div><span>Litri stimati</span><strong>{fmtNum(result.liters, 2)} L</strong></div>
          </div>
          <button className="btn-primary" type="button" onClick={saveToHistory}>
            <Save size={16} /> Salva nella cronologia
          </button>
        </section>

        {history.length > 0 && (
          <section className="pod history-pod">
            <div className="history-head">
              <p className="pod-label"><History size={13} /> Cronologia</p>
              <button className="link-btn" type="button" onClick={clearHistory}>Svuota</button>
            </div>
            <ul className="history-list">
              {history.map((h) => (
                <li key={h.id}>
                  <div>
                    <strong>{h.from.split(',')[0]} → {h.to.split(',')[0]}</strong>
                  </div>
                  <div className="history-cost">
                    <span>{fmtEuro(h.cost)}</span>
                    <button type="button" onClick={() => deleteHistoryItem(h.id)}><Trash2 size={14} /></button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}