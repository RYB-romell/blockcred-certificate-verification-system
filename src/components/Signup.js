import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!email || !pw) { setError("Enter email and password"); return; }
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      // Optionally: call backend to request role assignment or additional setup
      // await fetch("/api/users/register", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ uid:cred.user.uid, email }) });
      alert("Account created. You are now signed in.");
      navigate("/dashboard");
    } catch (e) {
      setError(e.message || "Signup failed");
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
      <div style={{width:420,background:'#fff',padding:'2rem',borderRadius:12,boxShadow:'0 8px 30px rgba(15,27,60,0.06)'}}>
        <h2 style={{marginBottom:8}}>Create account</h2>
        <p style={{color:'#6B7A99',marginBottom:16}}>Sign up to access BlockCred (default role: student)</p>
        {error && <div style={{background:'#FEF2F2',border:'1px solid #FECACA',padding:'0.75rem',borderRadius:8,color:'#DC2626',marginBottom:12}}>{error}</div>}
        <div style={{marginBottom:12}}>
          <label style={{display:'block',marginBottom:6,fontWeight:600}}>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',height:44,padding:'0 0.75rem',borderRadius:8,border:'1px solid #E4E8F0'}} />
        </div>
        <div style={{marginBottom:12}}>
          <label style={{display:'block',marginBottom:6,fontWeight:600}}>Password</label>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} style={{width:'100%',height:44,padding:'0 0.75rem',borderRadius:8,border:'1px solid #E4E8F0'}} />
        </div>
        <button onClick={handleSignup} disabled={loading} style={{width:'100%',height:46,borderRadius:10,background:'#2D3EAB',color:'#fff',border:'none',cursor:'pointer'}}>{loading? 'Creating…' : 'Create account'}</button>
        <div style={{textAlign:'center',marginTop:12}}>
          <a style={{color:'#2D3EAB',cursor:'pointer'}} onClick={()=>navigate('/login')}>Already have an account? Sign in</a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
