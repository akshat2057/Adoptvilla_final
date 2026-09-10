import React, { useEffect, useState } from "react";
import "./DogAssistant.css";

const initialMessages = [
  { role: "bot", text: "Hi! I am AdoptVilla Assistant 🐾 How can I help you find your perfect companion?" }
];

async function askGemini(message, history) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  const model = import.meta.env.VITE_GEMINI_MODEL || "gemini-3.6-flash";
  if (!key || key === "your_gemini_api_key_here") {
    return "Gemini API key is not connected. Add VITE_GEMINI_API_KEY in your .env file.";
  }

  const prompt = `You are AdoptVilla Assistant, a warm pet adoption expert. Help users with adoption, dogs, breeds and care. Keep answers friendly and concise.\n\n${history.map(m=>`${m.role}: ${m.text}`).join("\n")}\nuser: ${message}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({contents:[{parts:[{text:prompt}]}]})
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Gemini Error:", data);
      return "Gemini could not answer. Check your API key and VITE_GEMINI_MODEL setting.";
    }
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Please try again.";
  } catch (error) {
    console.error("Gemini Network Error:", error);
    return "Sorry, I am unable to connect right now. Please try again.";
  }
}

export default function DogAssistant(){
 const [open,setOpen]=useState(false);
 const [started,setStarted]=useState(false);
 const [form,setForm]=useState({name:"",phone:"",email:"",agree:false});
 const [errors,setErrors]=useState({});
 const [messages,setMessages]=useState(initialMessages);
 const [input,setInput]=useState("");
 const [loading,setLoading]=useState(false);

 useEffect(()=>{
  document.body.style.overflow=open ? "hidden" : "";
  return ()=>{ document.body.style.overflow=""; };
 },[open]);

 const validate=()=>{
  const e={};
  if(!form.name.trim()) e.name="Name is required";
  if(!/^\d{10}$/.test(form.phone)) e.phone="Enter valid 10 digit mobile number";
  if(!/^\S+@\S+\.\S+$/.test(form.email)) e.email="Enter valid email";
  if(!form.agree) e.agree="Please accept assistance consent";
  setErrors(e); return !Object.keys(e).length;
 };

 const send=async()=>{
  if(!input.trim()) return;
  const updated=[...messages,{role:"user",text:input}];
  setMessages(updated); setInput(""); setLoading(true);
  const reply=await askGemini(input,updated);
  setMessages([...updated,{role:"bot",text:reply}]); setLoading(false);
 };

 return <>
  <div className="adopt-chat-trigger">
   {!open && <div className="adopt-chat-bubble">🐶 Need help finding your furry friend?<br/><span>Let's chat →</span></div>}
   <button onClick={()=>setOpen(true)} aria-label="Open AdoptVilla Assistant">
    <video autoPlay loop muted playsInline preload="auto" aria-hidden="true">
     <source src="/assets/dog/dog-assistant-alpha.mov" type="video/quicktime" />
     <source src="/assets/dog/dog-assistant-alpha.webm" type="video/webm" />
     <source src="/assets/dog/dog-assistant.webm" type="video/webm" />
    </video>
   </button>
  </div>

  {open && !started && <div className="adopt-modal-overlay">
    <div className="adopt-modal">
      <button className="close" onClick={()=>setOpen(false)}>×</button>
      <h2>🐾 AdoptVilla Assistant</h2>
      <p>Let's understand your adoption needs</p>
      <input placeholder="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><small>{errors.name}</small>
      <div className="phone-box"><span>+91</span><input placeholder="Mobile Number" maxLength="10" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,"")})}/></div><small>{errors.phone}</small>
      <input placeholder="Email Address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><small>{errors.email}</small>
      <label className="agree"><input type="checkbox" checked={form.agree} onChange={e=>setForm({...form,agree:e.target.checked})}/> I agree to receive assistance</label><small>{errors.agree}</small>
      <button className="continue" onClick={()=>validate()&&setStarted(true)}>Continue to Chat</button>
    </div>
  </div>}

  {open && started && <div className="adopt-full-chat">
    <div className="chat-header"><div>🐾 AdoptVilla Assistant<br/><span>Online 🟢</span></div><button onClick={()=>setOpen(false)}>×</button></div>
    <div className="welcome"> <h2>Hello {form.name || "there"} 👋</h2><p>How can I help you today?</p><div className="quick"><button onClick={()=>setInput("Help me find a dog")}>Find my perfect dog</button><button onClick={()=>setInput("Explain adoption process")}>Adoption Process</button><button onClick={()=>setInput("Give dog care tips")}>Dog Care Tips</button></div></div>
    <section className="messages">{messages.map((m,i)=><div key={i} className={m.role}>{m.text}</div>)}{loading&&<div className="bot">Thinking...</div>}</section>
    <footer><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type your message"/><button onClick={send}>➤</button></footer>
  </div>}
 </>;
}
