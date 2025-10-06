"use client";

export default function Home() {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch(`${process.env.NEXT_PUBLIC_API}/_adj/adjuntar`, {
      method: "POST",
      body: f,
    });
    alert(r.ok ? "Enviado ✅" : "Error ❌");
  }

  const box = { display:"block", width:"100%", padding:"10px", margin:"8px 0", border:"1px solid #ccc", borderRadius:8 } as const;

  return (
    <main style={{minHeight:"100vh", background:"#f6f7f9"}}>
      <div style={{maxWidth:560, margin:"40px auto", background:"#fff", padding:24, borderRadius:16, boxShadow:"0 6px 24px rgba(0,0,0,.08)"}}>
        <h1 style={{fontSize:28, fontWeight:800, marginBottom:16}}>Adjuntar pago</h1>
        <form onSubmit={onSubmit}>
          <input name="nombre" placeholder="Nombre" required style={box}/>
          <input type="email" name="correo" placeholder="correo@dominio.com" style={box}/>
          <input type="number" name="numero_personas" min={1} placeholder="Número de personas" required style={box}/>
          <input name="producto" placeholder="Producto" required style={box}/>
          <input type="file" name="file" accept="image/*,application/pdf" required style={box}/>
          <button style={{...box, background:"#111", color:"#fff", cursor:"pointer"}}>Procesar</button>
        </form>
      </div>
    </main>
  );
}
