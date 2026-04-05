import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://sfwrcqypezmriycekfsd.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmd3JjcXlwZXptcml5Y2VrZnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MTI2MDcsImV4cCI6MjA5MDk4ODYwN30.QEVD7twXB0DWO36o805bQ7OtDnRAU_GQoP9H4Asev2c";

const hdrs = () => ({
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

const dbGet  = async (table, query="") => {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: hdrs() });
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } catch(e) { return []; }
};

const dbPost = async (table, body) => {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method:"POST", headers: hdrs(), body: JSON.stringify(body) });
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } catch(e) { return []; }
};

const C = {
  pink:"#F472B6", pinkLight:"#FDE8F3", pinkMid:"#EC4899",
  blue:"#93C5FD", blueLight:"#EFF6FF", blueMid:"#60A5FA",
  green:"#86EFAC", greenLight:"#F0FDF4", greenMid:"#4ADE80",
  bg:"#F8F5FF", text:"#2D2040", textMuted:"#9D8FB0",
  border:"rgba(147,197,253,0.3)",
};

const DEMO_TRUCKS = [
  { id:"demo-1", truck_name:"Frosty Wheels", specialty:"Soft Serve & Novelties", rating:4.8, eta:"4 min", color:C.pink, colorLight:C.pinkLight,
    menu_items:[
      {id:1,name:"Classic Vanilla Cone",    price:3.50,emoji:"🍦",popular:true, available:true},
      {id:2,name:"Strawberry Shortcake Bar",price:4.00,emoji:"🍓",popular:true, available:true},
      {id:3,name:"Chocolate Dip Cone",      price:4.50,emoji:"🍫",popular:false,available:true},
      {id:4,name:"Rainbow Popsicle",        price:2.50,emoji:"🌈",popular:false,available:false},
      {id:5,name:"Cookie Sandwich",         price:5.00,emoji:"🍪",popular:true, available:true},
      {id:6,name:"Mango Sorbet Cup",        price:3.75,emoji:"🥭",popular:false,available:true},
    ]},
  { id:"demo-2", truck_name:"The Cream Dream", specialty:"Artisan & Gourmet", rating:4.6, eta:"9 min", color:C.blue, colorLight:C.blueLight,
    menu_items:[
      {id:1,name:"Lavender Honey Cone",price:6.00,emoji:"🌸",popular:true, available:true},
      {id:2,name:"Matcha Soft Serve",  price:5.00,emoji:"🍵",popular:true, available:true},
      {id:3,name:"Churro Cone",        price:6.50,emoji:"🌀",popular:true, available:true},
    ]},
  { id:"demo-3", truck_name:"Sundae Driver", specialty:"Sundaes & Splits", rating:4.9, eta:"14 min", color:C.green, colorLight:C.greenLight,
    menu_items:[
      {id:1,name:"Banana Split Cup",  price:7.00,emoji:"🍌",popular:true, available:true},
      {id:2,name:"Hot Fudge Sundae",  price:6.50,emoji:"🍨",popular:true, available:true},
      {id:3,name:"Mint Chip Cone",    price:4.50,emoji:"🌿",popular:false,available:true},
    ]},
];

const DEMO_PINS = [
  {id:1,x_pct:28,y_pct:38,count:7},
  {id:2,x_pct:62,y_pct:55,count:3},
  {id:3,x_pct:45,y_pct:22,count:12},
  {id:4,x_pct:75,y_pct:30,count:5},
];

const TRUCK_DOTS = [
  {id:"demo-1",x:35,y:50},
  {id:"demo-2",x:60,y:35},
  {id:"demo-3",x:22,y:42},
];

export default function IScreamCustomer() {
  const [screen, setScreen]               = useState("map");
  const [trucks, setTrucks]               = useState(DEMO_TRUCKS);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [cart, setCart]                   = useState([]);
  const [demandPins, setDemandPins]       = useState(DEMO_PINS);
  const [droppingPin, setDroppingPin]     = useState(false);
  const [notif, setNotif]                 = useState(null);
  const [truckDots, setTruckDots]         = useState(TRUCK_DOTS);
  const [pulsePin, setPulsePin]           = useState(null);
  const [loading, setLoading]             = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);
  const [dbStatus, setDbStatus]           = useState("connecting");
  const mapRef = useRef(null);

  // Animate trucks
  useEffect(() => {
    const iv = setInterval(() => {
      setTruckDots(p => p.map(t => ({
        ...t,
        x: Math.max(5, Math.min(90, t.x + (Math.random()-.5)*1.5)),
        y: Math.max(5, Math.min(90, t.y + (Math.random()-.5)*1.5)),
      })));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  // Load from DB on mount
  useEffect(() => {
    loadTrucks();
    loadPins();
    setTimeout(() => showNotif("🍦 Frosty Wheels is 4 min from you!"), 1200);
  }, []);

  const loadTrucks = async () => {
    const data = await dbGet("drivers", "subscription_active=eq.true&select=*,menu_items(*)");
    if (data?.length > 0) {
      setTrucks(data.map((d,i) => ({
        ...d,
        eta: `${4+i*5} min`,
        color: [C.pink,C.blue,C.green][i%3],
        colorLight: [C.pinkLight,C.blueLight,C.greenLight][i%3],
      })));
      setDbStatus("connected");
    } else {
      setDbStatus("demo");
    }
  };

  const loadPins = async () => {
    const data = await dbGet("demand_pins", "active=eq.true&select=*");
    if (data?.length > 0) {
      setDemandPins(data.map(p => ({...p, count: p.count||1})));
    }
  };

  const showNotif = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3500);
  };

  const handleMapClick = async (e) => {
    if (!droppingPin) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const pin = { id: Date.now(), x_pct:x, y_pct:y, count:1, isUser:true };
    setDemandPins(p => [...p, pin]);
    setPulsePin(pin.id);
    setDroppingPin(false);
    showNotif("📍 Demand pin dropped! Drivers can see you.");
    setTimeout(() => setPulsePin(null), 2000);
    // Save to DB
    const saved = await dbPost("demand_pins", {
      lat: 40.7128 + (y-50)*.001,
      lng: -74.006 + (x-50)*.001,
      x_pct: x, y_pct: y, active: true,
    });
    if (saved?.length > 0) setDbStatus("connected");
  };

  const addToCart = (truck, item) => {
    if (!item.available) return;
    setCart(p => {
      const ex = p.find(c => c.itemId===item.id && c.truckId===truck.id);
      if (ex) return p.map(c => c.itemId===item.id && c.truckId===truck.id ? {...c,qty:c.qty+1} : c);
      return [...p, {truckId:truck.id, truckName:truck.truck_name, driverId:truck.id, itemId:item.id, name:item.name, price:item.price, emoji:item.emoji, qty:1}];
    });
    showNotif(`${item.emoji} ${item.name} added — guaranteed!`);
  };

  const removeFromCart = (tid, iid) => setCart(p => p.filter(c => !(c.truckId===tid && c.itemId===iid)));

  const placeOrder = async () => {
    setLoading(true);
    const subtotal    = cart.reduce((s,c) => s+c.price*c.qty, 0);
    const service_fee = +(subtotal*.08).toFixed(2);
    const total       = +(subtotal+service_fee).toFixed(2);
    const orderId     = `ISC-${Math.random().toString(36).substr(2,8).toUpperCase()}`;
    const driverRef = cart[0]?.driverId;
    const orderPayload = { items:cart, subtotal, service_fee, total, status:"pending" };
    if (driverRef) orderPayload.driver_id = driverRef;
    const saved = await dbPost("orders", orderPayload);
    if (saved?.length > 0) setDbStatus("connected");
    setOrderConfirmed({orderId, cart:[...cart], subtotal, total, savedToDb: saved?.length>0});
    setCart([]);
    setLoading(false);
    setScreen("confirmation");
  };

  const cartTotal = cart.reduce((s,c) => s+c.price*c.qty, 0);
  const cartCount = cart.reduce((s,c) => s+c.qty, 0);
  const getTruck  = (id) => trucks.find(t=>t.id===id)||DEMO_TRUCKS.find(t=>t.id===id);

  const statusColor = dbStatus==="connected"?C.greenMid:dbStatus==="demo"?C.pinkMid:"#FBBF24";
  const statusLabel = dbStatus==="connected"?"● Live DB":dbStatus==="demo"?"● Demo mode":"● Connecting...";

  return (
    <div style={{fontFamily:"'Fredoka One',cursive",background:C.bg,minHeight:"100vh",maxWidth:420,margin:"0 auto",position:"relative",overflow:"hidden",boxShadow:"0 0 60px rgba(0,0,0,0.12)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:0}
        .truck-dot{transition:left 2s ease,top 2s ease;position:absolute;transform:translate(-50%,-50%);cursor:pointer}
        .demand-pin{position:absolute;transform:translate(-50%,-100%);animation:pinDrop .4s cubic-bezier(.34,1.56,.64,1)}
        @keyframes pinDrop{0%{transform:translate(-50%,-200%);opacity:0}100%{transform:translate(-50%,-100%);opacity:1}}
        @keyframes pulse{0%{transform:translate(-50%,-50%) scale(.5);opacity:1}100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes notifSlide{0%{transform:translateX(120%);opacity:0}12%{transform:translateX(0);opacity:1}78%{transform:translateX(0);opacity:1}100%{transform:translateX(120%);opacity:0}}
        @keyframes truckBounce{0%,100%{transform:translate(-50%,-50%) rotate(-4deg)}50%{transform:translate(-50%,-50%) rotate(4deg)}}
        @keyframes heatPulse{0%,100%{opacity:.35;transform:translate(-50%,-50%) scale(1)}50%{opacity:.65;transform:translate(-50%,-50%) scale(1.1)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .se{animation:slideUp .32s cubic-bezier(.34,1.2,.64,1)}
        .btn-primary{background:linear-gradient(135deg,${C.pinkMid},${C.blueMid});color:white;border:none;border-radius:18px;padding:16px 24px;font-family:'Fredoka One',cursive;font-size:18px;cursor:pointer;width:100%;box-shadow:0 6px 20px rgba(244,114,182,.3);transition:transform .15s}
        .btn-primary:active{transform:scale(.97)}
        .btn-primary:disabled{opacity:.6}
        .tab-btn{flex:1;padding:10px 4px;border:none;background:transparent;font-family:'Fredoka One',cursive;font-size:12px;cursor:pointer;border-radius:12px;display:flex;flex-direction:column;align-items:center;gap:2px;color:${C.textMuted};transition:all .2s}
        .tab-btn.active{background:${C.pinkLight};color:${C.pinkMid}}
        .card-hover{transition:transform .15s;cursor:pointer}
        .card-hover:active{transform:scale(.97)}
      `}</style>

      {notif && (
        <div style={{position:"fixed",top:64,right:16,background:"white",borderRadius:16,padding:"12px 16px",boxShadow:"0 8px 28px rgba(147,197,253,.3)",zIndex:1000,maxWidth:265,fontSize:13,fontFamily:"'Nunito',sans-serif",fontWeight:700,color:C.text,animation:"notifSlide 3.5s ease forwards",borderLeft:`4px solid ${C.pink}`}}>
          {notif}
        </div>
      )}

      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${C.pink},${C.blue} 55%,${C.green})`,padding:"52px 20px 22px",position:"relative",overflow:"hidden"}}>
        {[[110,"-10px","-10px"],[60,"26px","-18px"]].map(([s,t,r],i)=>(
          <div key={i} style={{position:"absolute",top:t,right:r,width:s,height:s,borderRadius:"50%",background:"rgba(255,255,255,.15)",animation:`float ${2.5+i*.4}s ease-in-out infinite`,pointerEvents:"none"}}/>
        ))}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative"}}>
          <div>
            <div style={{fontSize:26,color:"white",letterSpacing:1}}>🍦 I Scream</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.9)",fontFamily:"'Nunito',sans-serif",fontWeight:700,marginTop:2,display:"flex",alignItems:"center",gap:6}}>
              {trucks.length} trucks nearby
              <span style={{background:"rgba(255,255,255,.25)",borderRadius:8,padding:"1px 6px",fontSize:10,color:"white"}}>{statusLabel}</span>
            </div>
          </div>
          {cartCount>0 && (
            <button onClick={()=>setScreen("cart")} style={{background:"white",border:"none",borderRadius:50,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",boxShadow:"0 4px 14px rgba(0,0,0,.12)"}}>
              🛒
              <div style={{position:"absolute",top:-4,right:-4,background:C.pinkMid,color:"white",borderRadius:50,width:20,height:20,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka One',cursive"}}>{cartCount}</div>
            </button>
          )}
        </div>
      </div>

      {/* MAP */}
      {screen==="map" && (
        <div className="se">
          <div ref={mapRef} onClick={handleMapClick} style={{position:"relative",height:320,background:`linear-gradient(160deg,${C.greenLight},${C.blueLight} 45%,${C.pinkLight})`,overflow:"hidden",cursor:droppingPin?"crosshair":"default"}}>
            {[20,40,60,80].map(p=><div key={`h${p}`} style={{position:"absolute",left:0,right:0,top:`${p}%`,height:1,background:"rgba(255,255,255,.7)"}}/>)}
            {[20,40,60,80].map(p=><div key={`v${p}`} style={{position:"absolute",top:0,bottom:0,left:`${p}%`,width:1,background:"rgba(255,255,255,.7)"}}/>)}
            {[{x:10,y:15,w:25,h:18},{x:40,y:10,w:30,h:20},{x:75,y:18,w:18,h:25},{x:8,y:48,w:28,h:20},{x:42,y:45,w:22,h:22},{x:70,y:50,w:24,h:18},{x:15,y:75,w:20,h:18},{x:45,y:72,w:35,h:20}].map((b,i)=>(
              <div key={i} style={{position:"absolute",left:`${b.x}%`,top:`${b.y}%`,width:`${b.w}%`,height:`${b.h}%`,background:"rgba(255,255,255,.5)",borderRadius:6}}/>
            ))}
            {demandPins.map(pin=>(
              <div key={`h${pin.id}`} style={{position:"absolute",left:`${pin.x_pct}%`,top:`${pin.y_pct}%`,width:`${44+(pin.count||1)*9}px`,height:`${44+(pin.count||1)*9}px`,borderRadius:"50%",background:`radial-gradient(circle,rgba(244,114,182,${Math.min(.45,.12+(pin.count||1)*.04)}) 0%,transparent 70%)`,transform:"translate(-50%,-50%)",animation:"heatPulse 3s ease-in-out infinite",animationDelay:`${(pin.id||0)*.3}s`,pointerEvents:"none"}}/>
            ))}
            {demandPins.map(pin=>(
              <div key={`p${pin.id}`} className="demand-pin" style={{left:`${pin.x_pct}%`,top:`${pin.y_pct}%`}}>
                {pin.id===pulsePin && <div style={{position:"absolute",width:60,height:60,borderRadius:"50%",background:"rgba(244,114,182,.25)",transform:"translate(-50%,-50%)",animation:"pulse 1.5s ease-out infinite"}}/>}
                <div style={{background:pin.isUser?`linear-gradient(135deg,${C.pinkMid},${C.blueMid})`:"rgba(244,114,182,.82)",color:"white",borderRadius:"50% 50% 50% 0",transform:"rotate(-45deg)",width:pin.isUser?34:28,height:pin.isUser?34:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:"'Fredoka One',cursive",boxShadow:"0 3px 10px rgba(244,114,182,.4)",border:pin.isUser?"2px solid white":"none"}}>
                  <span style={{transform:"rotate(45deg)"}}>{pin.count||1}</span>
                </div>
              </div>
            ))}
            {truckDots.map((dot,i) => {
              const truck = getTruck(dot.id);
              if (!truck) return null;
              return (
                <div key={dot.id} className="truck-dot" style={{left:`${dot.x}%`,top:`${dot.y}%`}} onClick={e=>{e.stopPropagation();setSelectedTruck(truck);setScreen("truck")}}>
                  <div style={{background:"white",borderRadius:14,padding:"6px 8px",boxShadow:"0 4px 16px rgba(0,0,0,.14)",fontSize:20,border:`2.5px solid ${truck.color}`,animation:"truckBounce 2.2s ease-in-out infinite",animationDelay:`${i*.5}s`}}>🚐</div>
                  <div style={{background:truck.color,color:C.text,borderRadius:8,padding:"2px 6px",fontSize:9,fontFamily:"'Fredoka One',cursive",textAlign:"center",marginTop:2,whiteSpace:"nowrap",maxWidth:72,overflow:"hidden",textOverflow:"ellipsis"}}>{truck.truck_name}</div>
                </div>
              );
            })}
            <button onClick={e=>{e.stopPropagation();setDroppingPin(!droppingPin);}} style={{position:"absolute",bottom:12,right:12,background:droppingPin?`linear-gradient(135deg,${C.pinkMid},${C.blueMid})`:"white",color:droppingPin?"white":C.pinkMid,border:`2px solid ${C.pink}`,borderRadius:14,padding:"8px 14px",fontFamily:"'Fredoka One',cursive",fontSize:13,cursor:"pointer",boxShadow:"0 4px 14px rgba(244,114,182,.22)",display:"flex",alignItems:"center",gap:6}}>
              📍 {droppingPin?"Tap to drop!":"I want ice cream here!"}
            </button>
            <div style={{position:"absolute",top:12,left:12,background:`linear-gradient(135deg,${C.pinkMid},${C.blueMid})`,color:"white",borderRadius:20,padding:"4px 10px",fontSize:11,fontFamily:"'Fredoka One',cursive",display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#A7F3D0",boxShadow:"0 0 6px #A7F3D0"}}/>LIVE
            </div>
          </div>

          <div style={{padding:"16px 16px 100px"}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:C.text,marginBottom:12}}>🚐 Trucks Near You</div>
            {trucks.map(truck=>(
              <div key={truck.id} className="card-hover" onClick={()=>{setSelectedTruck(truck);setScreen("truck");}} style={{background:"white",borderRadius:20,padding:16,marginBottom:12,boxShadow:"0 4px 18px rgba(147,197,253,.18)",display:"flex",alignItems:"center",gap:14,border:`1.5px solid ${truck.color}44`}}>
                <div style={{width:54,height:54,background:`linear-gradient(135deg,${truck.colorLight},${truck.color}55)`,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🚐</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:C.text}}>{truck.truck_name}</div>
                  <div style={{fontSize:12,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:600,marginTop:2}}>{truck.specialty}</div>
                  <div style={{display:"flex",gap:8,marginTop:6}}>
                    <span style={{fontSize:11,background:truck.colorLight,color:C.text,padding:"2px 8px",borderRadius:20,fontFamily:"'Fredoka One',cursive"}}>⏱ {truck.eta}</span>
                    <span style={{fontSize:11,color:"#FBBF24",fontFamily:"'Fredoka One',cursive"}}>★ {truck.rating}</span>
                  </div>
                </div>
                <div style={{color:truck.color,fontSize:22}}>›</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRUCK MENU */}
      {screen==="truck" && selectedTruck && (
        <div className="se" style={{paddingBottom:100}}>
          <div style={{background:`linear-gradient(135deg,${selectedTruck.color},${C.blue}88,${C.green}66)`,padding:"16px 20px 26px"}}>
            <button onClick={()=>setScreen("map")} style={{background:"rgba(255,255,255,.3)",border:"none",color:"white",borderRadius:12,padding:"6px 14px",fontFamily:"'Fredoka One',cursive",fontSize:14,cursor:"pointer",marginBottom:12}}>← Back</button>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:68,height:68,background:"rgba(255,255,255,.3)",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🚐</div>
              <div>
                <div style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:"white"}}>{selectedTruck.truck_name}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.9)",fontFamily:"'Nunito',sans-serif",fontWeight:600}}>{selectedTruck.specialty}</div>
                <div style={{display:"flex",gap:10,marginTop:5}}>
                  <span style={{fontSize:12,color:"white",fontFamily:"'Fredoka One',cursive"}}>⏱ {selectedTruck.eta}</span>
                  <span style={{fontSize:12,color:"white",fontFamily:"'Fredoka One',cursive"}}>★ {selectedTruck.rating}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{padding:"16px 16px 0"}}>
            <div style={{background:`linear-gradient(135deg,${C.blueLight},${C.pinkLight})`,borderRadius:16,padding:"10px 14px",marginBottom:16,fontSize:13,fontFamily:"'Nunito',sans-serif",fontWeight:700,color:C.pinkMid,border:`1px solid ${C.pink}44`}}>
              🔒 Pre-order = your item is GUARANTEED. Walk-ups are first come, first served.
            </div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:C.text,marginBottom:12}}>Menu</div>
            {(selectedTruck.menu_items||[]).map(item=>(
              <div key={item.id} className="card-hover" style={{background:"white",borderRadius:18,padding:14,marginBottom:10,display:"flex",alignItems:"center",gap:12,boxShadow:"0 3px 14px rgba(147,197,253,.15)",border:item.popular?`1.5px solid ${selectedTruck.color}`:`1px solid ${C.border}`,opacity:item.available?1:.5}} onClick={()=>addToCart(selectedTruck,item)}>
                <div style={{width:50,height:50,background:`linear-gradient(135deg,${selectedTruck.colorLight},${selectedTruck.color}44)`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{item.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:C.text,display:"flex",alignItems:"center",gap:6}}>
                    {item.name}
                    {item.popular&&<span style={{fontSize:9,background:`linear-gradient(135deg,${C.pinkMid},${C.blueMid})`,color:"white",padding:"2px 6px",borderRadius:20}}>FAVE</span>}
                    {!item.available&&<span style={{fontSize:9,background:"#ddd",color:"#888",padding:"2px 6px",borderRadius:20}}>SOLD OUT</span>}
                  </div>
                  <div style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:C.pinkMid,marginTop:2}}>${item.price.toFixed(2)}</div>
                </div>
                {item.available&&<div style={{background:`linear-gradient(135deg,${C.pinkMid},${C.blueMid})`,color:"white",borderRadius:10,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>+</div>}
              </div>
            ))}
          </div>
          {cartCount>0 && (
            <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 32px)",maxWidth:388}}>
              <button className="btn-primary" onClick={()=>setScreen("cart")}>🛒 View Order · ${cartTotal.toFixed(2)}</button>
            </div>
          )}
        </div>
      )}

      {/* CART */}
      {screen==="cart" && (
        <div className="se" style={{padding:"16px 16px 100px"}}>
          <button onClick={()=>setScreen(selectedTruck?"truck":"map")} style={{background:"transparent",border:"none",fontFamily:"'Fredoka One',cursive",fontSize:16,color:C.pinkMid,cursor:"pointer",marginBottom:16}}>← Back</button>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:C.text,marginBottom:6}}>Your Pre-Order 🛒</div>
          <div style={{background:`linear-gradient(135deg,${C.blueLight},${C.greenLight})`,borderRadius:14,padding:"10px 14px",marginBottom:16,fontSize:13,fontFamily:"'Nunito',sans-serif",fontWeight:700,color:"#059669",border:`1px solid ${C.green}`}}>
            ✅ These items are held for you — no more missing out!
          </div>
          {cart.length===0
            ? <div style={{textAlign:"center",padding:"40px 0",color:C.textMuted,fontFamily:"'Fredoka One',cursive",fontSize:16}}>Cart is empty 🍦</div>
            : <>
              {cart.map(item=>(
                <div key={`${item.truckId}-${item.itemId}`} style={{background:"white",borderRadius:18,padding:14,marginBottom:10,display:"flex",alignItems:"center",gap:12,boxShadow:"0 3px 12px rgba(147,197,253,.15)",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:26}}>{item.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Fredoka One',cursive",fontSize:14,color:C.text}}>{item.name}</div>
                    <div style={{fontSize:12,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:600}}>{item.truckName}</div>
                  </div>
                  <div style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:C.pinkMid}}>${(item.price*item.qty).toFixed(2)}</div>
                  <button onClick={()=>removeFromCart(item.truckId,item.itemId)} style={{background:C.pinkLight,border:"none",borderRadius:8,width:28,height:28,color:C.pinkMid,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
              ))}
              <div style={{background:"white",borderRadius:18,padding:16,marginTop:6,boxShadow:"0 3px 12px rgba(147,197,253,.12)",border:`1px solid ${C.border}`}}>
                {[["Subtotal",`$${cartTotal.toFixed(2)}`],["Service fee (8%)",`$${(cartTotal*.08).toFixed(2)}`]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,color:C.textMuted,fontSize:13}}>{l}</span>
                    <span style={{fontFamily:"'Fredoka One',cursive",color:C.text}}>{v}</span>
                  </div>
                ))}
                <div style={{height:1,background:C.border,margin:"10px 0"}}/>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontFamily:"'Fredoka One',cursive",color:C.text,fontSize:17}}>Total</span>
                  <span style={{fontFamily:"'Fredoka One',cursive",color:C.pinkMid,fontSize:17}}>${(cartTotal*1.08).toFixed(2)}</span>
                </div>
              </div>
              <div style={{marginTop:20}}>
                <button className="btn-primary" onClick={placeOrder} disabled={loading}>
                  {loading?"⏳ Placing order...":"🍦 Place Pre-Order · Guaranteed!"}
                </button>
              </div>
            </>
          }
        </div>
      )}

      {/* CONFIRMATION */}
      {screen==="confirmation" && orderConfirmed && (
        <div className="se" style={{padding:"40px 24px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",minHeight:"calc(100vh - 120px)"}}>
          <div style={{fontSize:80,marginBottom:16,animation:"float 2s ease-in-out infinite"}}>🎉</div>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,color:C.text,marginBottom:8}}>Order Confirmed!</div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:15,color:C.textMuted,marginBottom:24}}>Your ice cream is reserved and waiting</div>
          <div style={{background:`linear-gradient(135deg,${C.pink},${C.blue} 55%,${C.green})`,borderRadius:24,padding:20,width:"100%",color:"white",marginBottom:16}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:18,marginBottom:12}}>📍 Head to {orderConfirmed.cart[0]?.truckName}</div>
            {orderConfirmed.cart.map(item=>(
              <div key={`${item.truckId}-${item.itemId}`} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,.22)",borderRadius:12,padding:"8px 12px",marginBottom:6}}>
                <span style={{fontSize:20}}>{item.emoji}</span>
                <span style={{fontFamily:"'Fredoka One',cursive",fontSize:14}}>{item.name}</span>
                <span style={{marginLeft:"auto",fontFamily:"'Fredoka One',cursive",fontSize:14}}>${item.price.toFixed(2)}</span>
              </div>
            ))}
            <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,.3)",fontFamily:"'Fredoka One',cursive",fontSize:18,display:"flex",justifyContent:"space-between"}}>
              <span>Total Paid</span><span>${orderConfirmed.total.toFixed(2)}</span>
            </div>
          </div>
          <div style={{background:C.greenLight,borderRadius:16,padding:"12px 16px",width:"100%",marginBottom:24,fontSize:13,fontFamily:"'Nunito',sans-serif",fontWeight:700,color:"#059669",border:`1px solid ${C.green}`}}>
            🔒 Order ID: {orderConfirmed.orderId} · {orderConfirmed.savedToDb?"Saved to I Scream database ✅":"Recorded locally"}
          </div>
          <button className="btn-primary" onClick={()=>setScreen("map")}>Back to Map 🗺️</button>
        </div>
      )}

      {/* NAV */}
      {screen!=="confirmation" && (
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"white",borderTop:`1px solid ${C.border}`,padding:"8px 14px 22px",display:"flex",gap:4,boxShadow:"0 -8px 28px rgba(147,197,253,.15)"}}>
          <button className={`tab-btn ${screen==="map"?"active":""}`} onClick={()=>setScreen("map")}><span style={{fontSize:20}}>🗺️</span><span>Map</span></button>
          <button className={`tab-btn ${screen==="truck"?"active":""}`} onClick={()=>selectedTruck&&setScreen("truck")}><span style={{fontSize:20}}>🚐</span><span>Trucks</span></button>
          <button className={`tab-btn ${screen==="cart"?"active":""}`} onClick={()=>setScreen("cart")} style={{position:"relative"}}>
            <span style={{fontSize:20}}>🛒</span><span>Order</span>
            {cartCount>0&&<div style={{position:"absolute",top:6,right:"calc(50% - 18px)",background:C.pinkMid,color:"white",borderRadius:50,width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center"}}>{cartCount}</div>}
          </button>
          <button className="tab-btn"><span style={{fontSize:20}}>👤</span><span>Profile</span></button>
        </div>
      )}
    </div>
  );
}
