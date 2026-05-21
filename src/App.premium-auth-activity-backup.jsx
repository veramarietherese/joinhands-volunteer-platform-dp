import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useParams, useLocation } from "react-router-dom";
import "./index.css";

const KEYS = ["users","currentUser","selectedRole","opportunities","applications","savedOpportunities","messages","notifications","reports","organizations","profiles"];
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");
const uid = (p="id") => `${p}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const get = (k, fallback) => JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback));
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const orgNames = ["Red Cross Cebu City","Mactan Coastal Volunteers","Cebu Youth Learning Hub","Mandaue Medical Outreach","Busay Green Movement","Cebu Animal Rescue"];
const seedOpps = [
  ["Red Cross Cebu City Volunteer Drive","Health","Cebu City","First Aid","Red Cross Cebu City"],
  ["Coastal Cleanup Drive in Mactan","Environment","Lapu-Lapu City","Cleanup","Mactan Coastal Volunteers"],
  ["Community Feeding Program in Cebu City","Community","Cebu City","Food Prep","Red Cross Cebu City"],
  ["Tree Planting Activity in Busay","Environment","Busay","Gardening","Busay Green Movement"],
  ["Medical Mission in Mandaue","Health","Mandaue","Medical Support","Mandaue Medical Outreach"],
  ["Youth Education Support Program","Education","Cebu City","Tutoring","Cebu Youth Learning Hub"],
  ["Relief Goods Distribution Program","Disaster Response","Cebu City","Logistics","Red Cross Cebu City"],
  ["Animal Shelter Volunteer Support","Animal Welfare","Cebu City","Animal Care","Cebu Animal Rescue"],
];

function seed() {
  if (localStorage.getItem("joinhandsSeeded")) return;
  const organizations = orgNames.map((name, i) => ({ id:`org${i+1}`, name, location:["Cebu City","Lapu-Lapu","Cebu City","Mandaue","Busay","Cebu City"][i], status:i===5?"pending":"approved", field:["Health","Environment","Education","Medical","Environment","Animal Welfare"][i], description:`${name} connects Cebuano volunteers with meaningful local impact programs.` }));
  const opportunities = seedOpps.map((o,i)=>({ id:`opp${i+1}`, title:o[0], category:o[1], location:o[2], skill:o[3], org:o[4], orgId:organizations.find(x=>x.name===o[4])?.id, date:`2026-0${(i%5)+6}-${String(10+i).padStart(2,"0")}`, volunteersNeeded:20+i*4, status:"active", description:`Join ${o[4]} for a focused ${o[1].toLowerCase()} activity in ${o[2]}. Volunteers will help with coordination, field support, registration, and community engagement.`, requirements:"Commitment, respectful communication, willingness to serve, and basic orientation attendance.", createdAt:new Date().toISOString() }));
  set("users", [
    {id:"admin1", name:"JoinHands Admin", email:"admin@joinhands.app", role:"admin", status:"active"},
    {id:"vol1", name:"Dhan Volunteer", email:"volunteer@joinhands.app", role:"volunteer", status:"active"},
    {id:"orguser1", name:"Red Cross Cebu City", email:"org@joinhands.app", role:"organization", status:"active", orgId:"org1"}
  ]);
  set("organizations", organizations);
  set("opportunities", opportunities);
  set("applications", [{id:"app1", opportunityId:"opp1", volunteerId:"vol1", volunteerName:"Dhan Volunteer", status:"shortlisted", motivation:"I want to help Cebu communities through reliable volunteer work.", createdAt:new Date().toISOString()}]);
  set("savedOpportunities", ["opp2","opp6"]);
  set("messages", [{id:"msg1", from:"Red Cross Cebu City", to:"vol1", text:"Thanks for your interest. Orientation details will be sent soon.", createdAt:new Date().toISOString(), read:false}]);
  set("notifications", [{id:"n1", userId:"vol1", text:"Your application was shortlisted.", read:false, createdAt:new Date().toISOString()}]);
  set("reports", [{id:"r1", title:"Duplicate opportunity listing", status:"open", details:"A community member reported a repeated post.", createdAt:new Date().toISOString()}]);
  set("profiles", { vol1:{bio:"Student volunteer based in Cebu.", skills:"Tutoring, logistics, event support"}, orguser1:{mission:"Humanitarian response and community support in Cebu."} });
  localStorage.setItem("joinhandsSeeded","true");
}

function useStore(key, fallback=[]) {
  const [data, setData] = useState(()=>get(key,fallback));
  const save = (v) => { const next = typeof v === "function" ? v(get(key,fallback)) : v; set(key,next); setData(next); window.dispatchEvent(new Event("storage-sync")); };
  useEffect(()=>{ const f=()=>setData(get(key,fallback)); window.addEventListener("storage-sync",f); return()=>window.removeEventListener("storage-sync",f); },[key]);
  return [data, save];
}
function useAuth(){ const [user,setUser]=useStore("currentUser",null); return {user, login:setUser, logout:()=>setUser(null)}; }

function Shell({children, role}) {
  const {user,logout}=useAuth();
  const location = useLocation();

  const desktopNav = role==="admin"
    ? [["Dashboard","/admin/dashboard"],["Users","/admin/users"],["Organizations","/admin/organizations"],["Reports","/admin/reports"],["Analytics","/admin/analytics"]]
    : role==="organization"
    ? [["Dashboard","/organization/dashboard"],["Opportunities","/organization/opportunities"],["Create","/organization/create"],["Applicants","/organization/applicants"],["Messages","/organization/messages"],["Profile","/organization/profile"]]
    : [["Dashboard","/volunteer/dashboard"],["Discover","/volunteer/discover"],["Applications","/volunteer/applications"],["Saved","/volunteer/saved"],["Messages","/volunteer/messages"],["Streak","/volunteer/streak"],["Notifications","/volunteer/notifications"],["Profile","/volunteer/profile"]];

  const mobileNav = role==="volunteer"
    ? [["Home","/volunteer/dashboard"],["Activity","/volunteer/activity"],["Messages","/volunteer/messages"],["Streak","/volunteer/streak"],["Profile","/volunteer/profile"]]
    : desktopNav.slice(0,4);

  const isVolunteerHome = role==="volunteer" && location.pathname === "/volunteer/dashboard";

  function MobileIcon({label}){
    if(label==="Home") return <svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5h5v5"/></svg>;
    if(label==="Activity") return <svg viewBox="0 0 24 24"><path d="M5 6.5h14"/><path d="M5 12h14"/><path d="M5 17.5h9"/><path d="M17 16l2 2 3-4"/></svg>;
    if(label==="Messages") return <svg viewBox="0 0 24 24"><path d="M4.5 6.5h15v10h-9l-4.5 3v-3h-1.5z"/><path d="M8 10h8"/><path d="M8 13h5"/></svg>;
    if(label==="Streak") return <svg viewBox="0 0 24 24"><path d="M12 21c-3.9 0-7-2.8-7-6.7 0-2.4 1.2-4.5 3.1-5.7.1 1.7.8 2.8 2 3.5-.4-3.3 1.2-6.2 4.4-8.1.2 3 1.5 4.7 3.1 6.3 1.1 1.1 1.9 2.4 1.9 4 0 3.9-3.1 6.7-7.5 6.7Z"/><path d="M12 18c-1.4 0-2.5-1-2.5-2.3 0-1 .5-1.8 1.3-2.3.1.8.4 1.3 1 1.7-.1-1.3.5-2.5 1.8-3.4.1 1.2.6 1.9 1.2 2.6.4.4.7.9.7 1.5 0 1.2-1.1 2.2-3.5 2.2Z"/></svg>;
    if(label==="Profile") return <svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4.5 20c1.4-4 13.6-4 15 0"/></svg>;
    return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/></svg>;
  }

  return (
    <div className="min-h-screen app-bg text-slate-900">
      <aside className="sidebar glass hidden lg:flex">
        <Link className="brand" to="/">JoinHands</Link>
        <div className="text-sm text-slate-500 mb-4">Connecting people with purpose.</div>
        {desktopNav.map(n=><NavLink key={n[1]} to={n[1]} className="side-link">{n[0]}</NavLink>)}
        <button onClick={logout} className="ghost mt-auto">Sign out</button>
      </aside>

      <main className={`lg:pl-80 p-4 pb-32 lg:pb-8 max-w-7xl mx-auto ${!isVolunteerHome && role==="volunteer" ? "mobile-clean-page" : ""}`}>
        {isVolunteerHome ? (
          <div className="home-welcome glass">
            <div>
              <p className="welcome-gradient">Welcome Back to JoinHands</p>
              <h1>{user?.name || "Volunteer"}</h1>
            </div>
            <Link to="/volunteer/profile" className="avatar-link" aria-label="Open profile">
              <span>{(user?.name || "V").slice(0,1).toUpperCase()}</span>
            </Link>
          </div>
        ) : role !== "volunteer" ? (
          <div className="topbar glass">
            <div>
              <p className="eyebrow">{role} workspace</p>
              <h1 className="text-2xl font-bold">Welcome{user?.name?`, ${user.name.split(" ")[0]}`:""}</h1>
            </div>
            <button onClick={logout} className="btn-secondary hidden sm:block">Sign out</button>
          </div>
        ) : null}

        {children}
      </main>

      <nav className="bottom-nav bottom-nav-four lg:hidden glass">
        {mobileNav.map(n=>(
          <NavLink key={n[1]} to={n[1]} className="mobile-tab">
            <MobileIcon label={n[0]} />
            <span>{n[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
function Card({children,className=""}){return <section className={`glass card ${className}`}>{children}</section>}
function Button({children, className="", ...p}){return <button className={`btn ${className}`} {...p}>{children}</button>}
function Field({label,error,...p}){return <label className="field"><span>{label}</span><input {...p}/>{error&&<small>{error}</small>}</label>}
function Select({label,children,...p}){return <label className="field"><span>{label}</span><select {...p}>{children}</select></label>}
function PublicLayout({children}){return <div className="min-h-screen app-bg p-4"><header className="glass public-nav"><Link to="/" className="brand">JoinHands</Link><nav><Link to="/role">Get Started</Link><Link to="/signin">Sign In</Link></nav></header>{children}</div>}

function Landing(){return <PublicLayout><section className="hero"><div className="glass hero-card"><p className="eyebrow">Volunteer platform for Cebu communities</p><h1>Connecting people with purpose.</h1><p>Discover opportunities, support verified organizations, manage applications, and coordinate local impact through a polished frontend demo.</p><div className="flex flex-wrap gap-3"><Link className="btn" to="/role">Start now</Link><Link className="btn-secondary" to="/volunteer/discover">Explore demo</Link></div></div><div className="glass stats"><b>8</b><span>Seeded opportunities</span><b>6</b><span>Local organizations</span><b>100%</b><span>Frontend-only demo</span></div></section></PublicLayout>}
function Role(){return <PublicLayout><div className="center-grid">{["volunteer","organization"].map(r=><Card key={r}><h2 className="text-2xl font-bold capitalize">{r}</h2><p className="muted my-3">{r==="volunteer"?"Find causes, save opportunities, and apply with confidence.":"Create opportunities and manage applicants locally."}</p><Link onClick={()=>set("selectedRole",r)} className="btn w-full text-center" to="/signup">Continue as {r}</Link></Card>)}</div></PublicLayout>}

function SocialAuthButtons({mode="signin"}){
  const nav = useNavigate(), { login } = useAuth();

  function handleSocial(provider){
    const selectedRole = get("selectedRole","volunteer");
    const userEmail = provider === "google"
      ? "google.demo@joinhands.app"
      : "apple.demo@joinhands.app";

    const userName = provider === "google"
      ? "Google Demo User"
      : "Apple Demo User";

    const role = selectedRole;
    const users = get("users",[]);
    let user = users.find(u => u.email === userEmail);

    if(!user){
      user = {
        id: uid("user"),
        name: userName,
        email: userEmail,
        role,
        status: "active",
        provider
      };
      set("users",[...users,user]);
    }

    login(user);
    nav(`/${role}/dashboard`);
  }

  return (
    <div className="social-auth">
      <div className="auth-divider">
        <span></span>
        <p>or continue with</p>
        <span></span>
      </div>

      <button type="button" className="social-btn premium-social" onClick={()=>handleSocial("google")}>
        <span className="social-logo-wrap">
          <svg viewBox="0 0 24 24" className="brand-logo" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
            <path d="M12 5.37c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.99 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.37 12 5.37z"/>
          </svg>
        </span>
        Continue with Google
      </button>

      <button type="button" className="social-btn premium-social" onClick={()=>handleSocial("apple")}>
        <span className="social-logo-wrap">
          <svg viewBox="0 0 24 24" className="brand-logo" aria-hidden="true">
            <path d="M16.37 12.74c.03 3.14 2.75 4.19 2.78 4.2-.02.07-.43 1.48-1.41 2.94-.85 1.26-1.73 2.52-3.12 2.55-1.36.03-1.8-.81-3.36-.81-1.56 0-2.05.78-3.33.84-1.34.05-2.37-1.35-3.23-2.6C2.95 18.2 1.6 15.2 3.4 12.08c.89-1.55 2.49-2.53 4.22-2.56 1.31-.03 2.55.89 3.36.89.81 0 2.33-1.1 3.93-.94.67.03 2.57.27 3.79 2.06-.1.06-2.27 1.32-2.33 3.21z"/>
            <path d="M14.23 3.34c.71-.86 1.18-2.06 1.05-3.24-1.03.04-2.28.69-3.02 1.55-.66.77-1.23 2-1.08 3.17 1.15.09 2.33-.58 3.05-1.48z"/>
          </svg>
        </span>
        Continue with Apple
      </button>
    </div>
  )
}

function SignIn(){const nav=useNavigate(),{login}=useAuth();const[form,setForm]=useState({email:"",password:""}),[err,setErr]=useState({});function submit(e){e.preventDefault();let er={}; if(!emailOk(form.email))er.email="Enter a valid email."; if(!form.password)er.password="Password is required."; setErr(er); if(Object.keys(er).length)return; const role=form.email==="admin@joinhands.app"?"admin":get("selectedRole","volunteer"); const users=get("users",[]); let u=users.find(x=>x.email===form.email)||{id:uid("user"),name:form.email.split("@")[0],email:form.email,role,status:"active"}; login(u); nav(`/${u.role}/dashboard`)}return <PublicLayout><AuthCard title="Sign in" form={form} setForm={setForm} submit={submit} err={err}/></PublicLayout>}
function SignUp(){
  const nav = useNavigate(), { login } = useAuth();
  const [ok, setOk] = useState("");
  const [form, setForm] = useState({
    name: "",
    age: "",
    email: "",
    password: "",
    confirm: "",
    role: get("selectedRole", "volunteer"),
    terms: false,
    contactPerson: "",
    location: "",
    field: ""
  });
  const [err, setErr] = useState({});

  function submit(e){
    e.preventDefault();
    let er = {};

    if (form.role === "volunteer") {
      if (!form.name) er.name = "Full name is required.";
      if (!/^\d+$/.test(form.age)) er.age = "Age must be numbers only.";
    }

    if (form.role === "organization") {
      if (!form.name) er.name = "Organization name is required.";
      if (!form.contactPerson) er.contactPerson = "Contact person is required.";
      if (!form.location) er.location = "Location is required.";
      if (!form.field) er.field = "Organization field is required.";
    }

    if (!emailOk(form.email)) er.email = "Valid email required.";
    if (!form.password) er.password = "Password is required.";
    if (form.password !== form.confirm) er.confirm = "Passwords must match.";
    if (!form.terms) er.terms = "Please accept the terms.";

    setErr(er);
    if (Object.keys(er).length) return;

    const userId = uid("user");
    const orgId = form.role === "organization" ? uid("org") : undefined;

    const user = {
      id: userId,
      name: form.name,
      email: form.email,
      role: form.role,
      status: "active",
      ...(form.role === "volunteer" ? { age: form.age } : {}),
      ...(form.role === "organization" ? {
        orgId,
        contactPerson: form.contactPerson,
        location: form.location,
        field: form.field
      } : {})
    };

    set("users", [...get("users", []), user]);

    if (form.role === "organization") {
      const newOrg = {
        id: orgId,
        name: form.name,
        location: form.location,
        field: form.field,
        status: "pending",
        description: `${form.name} is awaiting JoinHands admin review.`
      };

      set("organizations", [...get("organizations", []), newOrg]);
    }

    login(user);
    setOk("Account created successfully.");
    setTimeout(() => nav(`/${form.role}/dashboard`), 300);
  }

  return (
    <PublicLayout>
      <Card className="auth">
        <h2>Create your account</h2>

        <form onSubmit={submit} className="space-y-3">
          <Select
            label="Role"
            value={form.role}
            onChange={e => {
              const role = e.target.value;
              set("selectedRole", role);
              setForm({
                ...form,
                role,
                name: "",
                age: "",
                contactPerson: "",
                location: "",
                field: ""
              });
              setErr({});
            }}
          >
            <option value="volunteer">Volunteer</option>
            <option value="organization">Organization</option>
          </Select>

          {form.role === "volunteer" ? (
            <>
              <Field label="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} error={err.name}/>
              <Field label="Age" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} error={err.age}/>
              <Field label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} error={err.email}/>
            </>
          ) : (
            <>
              <Field label="Organization name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} error={err.name}/>
              <Field label="Contact person" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} error={err.contactPerson}/>
              <Field label="Organization email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} error={err.email}/>
              <Field label="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} error={err.location}/>
              <Field label="Organization field / category" value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} error={err.field}/>
            </>
          )}

          <Field label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} error={err.password}/>
          <Field label="Confirm password" type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} error={err.confirm}/>

          <label className="check">
            <input type="checkbox" checked={form.terms} onChange={e => setForm({ ...form, terms: e.target.checked })}/>
            I agree to JoinHands demo terms.
          </label>

          {err.terms && <small className="error">{err.terms}</small>}
          {ok && <p className="success">{ok}</p>}

          <Button className="w-full">Create account</Button><SocialAuthButtons mode="signup"/>
        </form>
      </Card>
    </PublicLayout>
  );
}

function AuthCard({title,form,setForm,submit,err}){return <Card className="auth"><h2>{title}</h2><form onSubmit={submit} className="space-y-4"><Field label="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} error={err.email}/><Field label="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} error={err.password}/><Button className="w-full">Sign in</Button><SocialAuthButtons mode="signin"/><Link className="muted block text-center" to="/forgot-password">Forgot password?</Link></form></Card>}
function Forgot(){const[mail,setMail]=useState(""),[msg,setMsg]=useState(""),[err,setErr]=useState("");return <PublicLayout><Card className="auth"><h2>Reset password</h2><form onSubmit={e=>{e.preventDefault(); if(!emailOk(mail)){setErr("Enter a valid email.");return} setErr("");setMsg("Password reset instructions were simulated successfully.");}}><Field label="Email" value={mail} onChange={e=>setMail(e.target.value)} error={err}/><Button className="w-full mt-4">Send reset link</Button>{msg&&<p className="success">{msg}</p>}</form></Card></PublicLayout>}

function OppFilters({setQ,setCat,setLoc,setSkill,cats,locs,skills}){return <Card className="grid md:grid-cols-4 gap-3"><input className="input" placeholder="Search opportunities" onChange={e=>setQ(e.target.value)}/><select className="input" onChange={e=>setCat(e.target.value)}><option value="">All categories</option>{cats.map(x=><option key={x}>{x}</option>)}</select><select className="input" onChange={e=>setLoc(e.target.value)}><option value="">All locations</option>{locs.map(x=><option key={x}>{x}</option>)}</select><select className="input" onChange={e=>setSkill(e.target.value)}><option value="">All skills</option>{skills.map(x=><option key={x}>{x}</option>)}</select></Card>}
function OpportunityGrid({items}){return <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{items.map(o=><Card key={o.id}><p className="pill">{o.category}</p><h3 className="text-xl font-bold mt-3">{o.title}</h3><p className="muted">{o.org}</p><p className="mt-3">{o.location} • {o.skill}</p><Link className="btn-secondary mt-4 inline-block" to={`/volunteer/opportunity/${o.id}`}>View details</Link></Card>)}</div>}
function VolunteerDashboard(){
  const [opps]=useStore("opportunities",[]);
  const [users]=useStore("users",[]);
  const [orgs]=useStore("organizations",[]);
  const [q,setQ]=useState("");
  const [cat,setCat]=useState("");
  const [loc,setLoc]=useState("");
  const [skill,setSkill]=useState("");

  const categories = [...new Set(opps.map(o=>o.category))];
  const locations = [...new Set(opps.map(o=>o.location))];
  const skills = [...new Set(opps.map(o=>o.skill))];

  const filtered = opps.filter(o =>
    o.status==="active" &&
    (!q || o.title.toLowerCase().includes(q.toLowerCase()) || o.org.toLowerCase().includes(q.toLowerCase())) &&
    (!cat || o.category===cat) &&
    (!loc || o.location===loc) &&
    (!skill || o.skill===skill)
  );

  return (
    <Shell role="volunteer">
      <section className="home-stats glass">
        <div>
          <span>{opps.filter(o=>o.status==="active").length}</span>
          <p>Open Opportunities</p>
        </div>
        <div>
          <span>{users.filter(u=>u.role==="volunteer").length + 128}</span>
          <p>Total Volunteers</p>
        </div>
        <div>
          <span>{orgs.length}</span>
          <p>Total Organizations</p>
        </div>
      </section>

      <section className="home-discovery glass">
        <div className="home-section-head">
          <div>
            <p className="eyebrow">Find your next cause</p>
            <h2>Discover opportunities</h2>
          </div>
          <span>{filtered.length} results</span>
        </div>

        <div className="home-search-panel">
          <input
            className="home-search-input"
            placeholder="Search volunteer opportunities"
            value={q}
            onChange={e=>setQ(e.target.value)}
          />

          <div className="home-filter-grid">
            <select value={cat} onChange={e=>setCat(e.target.value)}>
              <option value="">All categories</option>
              {categories.map(x=><option key={x} value={x}>{x}</option>)}
            </select>

            <select value={loc} onChange={e=>setLoc(e.target.value)}>
              <option value="">All locations</option>
              {locations.map(x=><option key={x} value={x}>{x}</option>)}
            </select>

            <select value={skill} onChange={e=>setSkill(e.target.value)}>
              <option value="">All skills</option>
              {skills.map(x=><option key={x} value={x}>{x}</option>)}
            </select>
          </div>
        </div>

        <div className="category-glass-grid">
          {categories.slice(0,6).map(category=>(
            <button
              key={category}
              className={`category-glass-card ${cat===category ? "active" : ""}`}
              onClick={()=>setCat(cat===category ? "" : category)}
            >
              <span>{category.slice(0,2).toUpperCase()}</span>
              <b>{category}</b>
              <small>{opps.filter(o=>o.category===category).length} opportunities</small>
            </button>
          ))}
        </div>
      </section>

      <section className="home-recommendations">
        <div className="home-section-head">
          <div>
            <p className="eyebrow">Recommended</p>
            <h2>Opportunities for you</h2>
          </div>
        </div>

        {filtered.length ? (
          <OpportunityGrid items={filtered.slice(0,6)}/>
        ) : (
          <Empty text="No matching opportunities found. Try changing your filters."/>
        )}
      </section>
    </Shell>
  )
}

function Discover(){const[opps]=useStore("opportunities",[]);const[q,setQ]=useState(""),[cat,setCat]=useState(""),[loc,setLoc]=useState(""),[skill,setSkill]=useState("");const f=opps.filter(o=>o.status==="active"&&(!q||o.title.toLowerCase().includes(q.toLowerCase())||o.org.toLowerCase().includes(q.toLowerCase()))&&(!cat||o.category===cat)&&(!loc||o.location===loc)&&(!skill||o.skill===skill));return <Shell role="volunteer"><OppFilters setQ={setQ} setCat={setCat} setLoc={setLoc} setSkill={setSkill} cats={[...new Set(opps.map(o=>o.category))]} locs={[...new Set(opps.map(o=>o.location))]} skills={[...new Set(opps.map(o=>o.skill))]}/><div className="mt-5">{f.length?<OpportunityGrid items={f}/>:<Empty text="No matching opportunities found."/>}</div></Shell>}
function OpportunityDetail(){const{id}=useParams(),[opps]=useStore("opportunities",[]),[saved,setSaved]=useStore("savedOpportunities",[]);const o=opps.find(x=>x.id===id); if(!o)return <Shell role="volunteer"><Empty text="Opportunity not found."/></Shell>; const is=saved.includes(id);return <Shell role="volunteer"><Card><p className="pill">{o.category}</p><h2 className="text-3xl font-bold mt-3">{o.title}</h2><p className="muted">{o.org} • {o.location} • {o.date}</p><p className="my-5">{o.description}</p><p><b>Requirements:</b> {o.requirements}</p><div className="flex gap-3 mt-6"><Link className="btn" to={`/volunteer/apply/${id}`}>Apply now</Link><button className="btn-secondary" onClick={()=>setSaved(is?saved.filter(x=>x!==id):[...saved,id])}>{is?"Unsave":"Save"}</button></div></Card></Shell>}
function Apply(){const{id}=useParams(),nav=useNavigate(),{user}=useAuth();const[txt,setTxt]=useState(""),[err,setErr]=useState("");const[apps,setApps]=useStore("applications",[]);return <Shell role="volunteer"><Card><h2 className="text-2xl font-bold">Application</h2><textarea className="textarea" placeholder="Why do you want to join?" value={txt} onChange={e=>setTxt(e.target.value)}/>{err&&<p className="error">{err}</p>}<Button onClick={()=>{if(txt.length<20){setErr("Motivation must be at least 20 characters.");return} setApps([...apps,{id:uid("app"),opportunityId:id,volunteerId:user?.id||"guest",volunteerName:user?.name||"Guest Volunteer",motivation:txt,status:"pending",createdAt:new Date().toISOString()}]); nav("/volunteer/applications")}}>Submit application</Button></Card></Shell>}
function MyApplications(){const[apps]=useStore("applications",[]),[opps]=useStore("opportunities",[]);return <Shell role="volunteer"><List items={apps} render={a=><Card key={a.id}><h3 className="font-bold">{opps.find(o=>o.id===a.opportunityId)?.title||"Opportunity"}</h3><p className="pill mt-2">{a.status}</p><p className="muted mt-2">{a.motivation}</p></Card>} empty="No applications yet."/></Shell>}
function Saved(){const[ids]=useStore("savedOpportunities",[]),[opps]=useStore("opportunities",[]);return <Shell role="volunteer"><OpportunityGrid items={opps.filter(o=>ids.includes(o.id))}/></Shell>}
function ActivityPage(){
  const [savedIds]=useStore("savedOpportunities",[]);
  const [opps]=useStore("opportunities",[]);
  const [apps]=useStore("applications",[]);
  const saved = opps.filter(o=>savedIds.includes(o.id));
  const pending = apps.filter(a=>a.status==="pending" || a.status==="shortlisted");
  const upcoming = opps.filter(o=>o.status==="active").slice(0,3);

  return (
    <Shell role="volunteer">
      <div className="activity-layout">
        <Card>
          <p className="eyebrow">Volunteer activity</p>
          <h2 className="text-2xl font-bold">Saved, pending, and upcoming</h2>
          <p className="muted mt-2">Track the opportunities that matter most to you.</p>
        </Card>

        <div className="activity-grid">
          <Card>
            <h3 className="font-bold text-lg">Saved Opportunities</h3>
            <div className="activity-stack">
              {saved.length ? saved.map(o=><Link key={o.id} className="activity-item" to={`/volunteer/opportunity/${o.id}`}><b>{o.title}</b><span>{o.location} • {o.category}</span></Link>) : <p className="muted">No saved opportunities yet.</p>}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-lg">Pending Applications</h3>
            <div className="activity-stack">
              {pending.length ? pending.map(a=><div key={a.id} className="activity-item"><b>{opps.find(o=>o.id===a.opportunityId)?.title || "Opportunity"}</b><span>{a.status}</span></div>) : <p className="muted">No pending applications.</p>}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-lg">Upcoming Volunteer Events</h3>
            <div className="activity-stack">
              {upcoming.map(o=><Link key={o.id} className="activity-item" to={`/volunteer/opportunity/${o.id}`}><b>{o.title}</b><span>{o.date} • {o.location}</span></Link>)}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  )
}

function Messages({role="volunteer"}){
  const seedThreads = [
    {id:"redcross", group:"Red Cross", name:"Preparation Team", preview:"Orientation details are ready.", unread:3},
    {id:"distribution", group:"Red Cross", name:"Distribution Team", preview:"Packing starts at 8 AM.", unread:1},
    {id:"water", group:"Water Distribution", name:"Field Volunteers", preview:"Bring tumblers and caps.", unread:2},
    {id:"feeding", group:"Community Feeding", name:"Meal Prep Team", preview:"Final headcount confirmed.", unread:5},
    {id:"medical", group:"Medical Mission", name:"Mandaue Medical Team", preview:"Please confirm your availability.", unread:0}
  ];

  const [threads] = useState(seedThreads);
  const [active, setActive] = useState(seedThreads[0].id);
  const [query, setQuery] = useState("");
  const [allMessages, setAllMessages] = useStore("messages", []);
  const [text, setText] = useState("");

  const activeThread = threads.find(t => t.id === active);
  const filteredThreads = threads.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.group.toLowerCase().includes(query.toLowerCase())
  );

  const threadMessages = allMessages.filter(m => m.threadId === active);

  const fallbackMessages = [
    {id:"demo1", threadId:active, from:"Ken Rod", side:"in", text:"Hey team, morning! Who's joining this April 24?", createdAt:new Date().toISOString()},
    {id:"demo2", threadId:active, from:"Cindy Lepatan", side:"in", text:"I'm confirming my participation. Where is our meeting place?", createdAt:new Date().toISOString()},
    {id:"demo3", threadId:active, from:"You", side:"out", text:"Thanks for confirming. Address: Osmeña Blvd, Cebu City.", createdAt:new Date().toISOString()}
  ];

  const visibleMessages = threadMessages.length ? threadMessages : fallbackMessages;

  function sendMessage(){
    if(!text.trim()) return;
    setAllMessages([
      ...allMessages,
      {
        id: uid("msg"),
        threadId: active,
        from: role === "organization" ? "Organization" : "You",
        to: activeThread?.name || "Team",
        side: "out",
        text: text.trim(),
        createdAt: new Date().toISOString(),
        read: false
      }
    ]);
    setText("");
  }

  

  if(role === "organization"){
    return (
      <Shell role={role}>
        <Card>
          <h2 className="text-2xl font-bold">Organization Messages</h2>
          <p className="muted mt-2">Coordinate with volunteers and applicants through local demo messages.</p>
          <div className="space-y-3 my-4">
            {allMessages.map(m => (
              <div key={m.id} className="message">
                <b>{m.from}</b>
                <p>{m.text}</p>
              </div>
            ))}
          </div>
          <input className="input" placeholder="Write a local message" value={text} onChange={e=>setText(e.target.value)}/>
          <Button className="mt-3" disabled={!text} onClick={sendMessage}>Send</Button>
        </Card>
      </Shell>
    )
  }

  return (
    <Shell role="volunteer">
      <div className="chat-shell glass">
        <aside className="chat-list">
          <div className="chat-search-wrap">
            <h2>Messages</h2>
            <input className="chat-search" placeholder="Search workspace" value={query} onChange={e=>setQuery(e.target.value)}/>
          </div>

          <div className="chat-groups">
            {filteredThreads.map(thread => (
              <button
                key={thread.id}
                className={`chat-row ${active === thread.id ? "active" : ""}`}
                onClick={() => setActive(thread.id)}
              >
                <span className="chat-avatar">{thread.name.slice(0,1)}</span>
                <span className="chat-meta">
                  <small>{thread.group}</small>
                  <b>{thread.name}</b>
                  <em>{thread.preview}</em>
                </span>
                {thread.unread > 0 && <span className="unread-badge">{thread.unread}</span>}
              </button>
            ))}
          </div>
        </aside>

        <section className="chat-panel">
          {activeThread ? (
            <>
              <div className="chat-header">
                <div>
                  <small>{activeThread.group}</small>
                  <h3>{activeThread.name}</h3>
                </div>
                <span className="chat-status">Active</span>
              </div>

              <div className="chat-window">
                <span className="chat-date">Today 9:00</span>
                {visibleMessages.map(m => (
                  <div key={m.id} className={`bubble-row ${m.side === "out" ? "out" : "in"}`}>
                    {m.side !== "out" && <span className="mini-avatar">{m.from.slice(0,1)}</span>}
                    <div className={`chat-bubble ${m.side === "out" ? "outgoing" : "incoming"}`}>
                      <small>{m.from}</small>
                      <p>{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="message-composer">
                <input
                  placeholder="Type message here..."
                  value={text}
                  onChange={e=>setText(e.target.value)}
                  onKeyDown={e=>{ if(e.key === "Enter") sendMessage(); }}
                />
                <button onClick={sendMessage} disabled={!text.trim()}>Send</button>
              </div>
            </>
          ) : (
            <div className="chat-empty">Select a conversation to begin.</div>
          )}
        </section>
      </div>
    </Shell>
  )
}

function StreakPage(){
  const {user} = useAuth();
  const [streak, setStreak] = useStore("streak", {
    current: 5,
    impactWeeks: 24,
    level: "Community Helper",
    progress: 50,
    stage: 5
  });
  const [message, setMessage] = useState("");

  function logActivity(){
    const nextProgress = Math.min(100, streak.progress + 10);
    const next = {
      ...streak,
      current: streak.current + 1,
      impactWeeks: Math.floor((streak.current + 1) / 7) + 24,
      progress: nextProgress >= 100 ? 10 : nextProgress,
      stage: nextProgress >= 100 ? Math.min(10, streak.stage + 1) : streak.stage,
      level: streak.current + 1 >= 20 ? "Impact Builder" : "Community Helper"
    };
    setStreak(next);
    setMessage("Volunteer activity logged successfully.");
    setTimeout(() => setMessage(""), 2200);
  }

  return (
    <Shell role="volunteer">
      <div className="streak-page">
        <section className="streak-phone glass">
          <div className="streak-top">
            <span>9:41</span>
            <div className="streak-progress-wrap">
              <div className="streak-progress">
                <span style={{width:`${streak.progress}%`}} />
              </div>
              <small>Hatching Stage: {streak.stage}/10</small>
            </div>
          </div>

          <div className="streak-name">
            <h2>{user?.name || "Volunteer"}</h2>
            <p>{streak.level}</p>
          </div>

          <div className="pet-stage">
            <span className="sparkle s1"></span>
            <span className="sparkle s2"></span>
            <span className="sparkle s3"></span>

            <div className="pet">
              <div className="pet-feathers"></div>
              <div className="pet-head">
                <span className="eye left"></span>
                <span className="eye right"></span>
                <span className="beak"></span>
              </div>
              <div className="pet-body">
                <span>JOINHANDS</span>
              </div>
              <div className="pet-feet"></div>
            </div>
          </div>

          <div className="streak-summary">
            <p>Total Streak</p>
            <h3>{streak.impactWeeks} Weeks</h3>
            <span>{streak.current} activities logged</span>
          </div>

          <div className="badge-row">
            <span>Early Helper</span>
            <span>2 Month Streak</span>
            <span>Community Builder</span>
          </div>

          {message && <p className="success text-center mt-4">{message}</p>}

          <Button className="w-full mt-5" onClick={logActivity}>
            Log volunteer activity
          </Button>
        </section>
      </div>
    </Shell>
  )
}

function Notifications(){const[n,setN]=useStore("notifications",[]);return <Shell role="volunteer"><List items={n} render={x=><Card key={x.id}><p>{x.text}</p><button className="btn-secondary mt-3" onClick={()=>setN(n.map(a=>a.id===x.id?{...a,read:true}:a))}>{x.read?"Read":"Mark as read"}</button></Card>} empty="No notifications."/></Shell>}
function Profile({role="volunteer"}){const{user}=useAuth();const[profiles,setProfiles]=useStore("profiles",{});const[p,setP]=useState(profiles[user?.id]||{});return <Shell role={role}><Card><h2 className="text-2xl font-bold">Profile</h2><input className="input mt-4" placeholder="Bio or mission" value={p.bio||p.mission||""} onChange={e=>setP({...p,bio:e.target.value,mission:e.target.value})}/><input className="input mt-3" placeholder="Skills / Field" value={p.skills||""} onChange={e=>setP({...p,skills:e.target.value})}/><Button className="mt-4" onClick={()=>setProfiles({...profiles,[user?.id||"guest"]:p})}>Save profile</Button></Card></Shell>}

function OrgDashboard(){const[opps]=useStore("opportunities",[]),[apps]=useStore("applications",[]);return <Shell role="organization"><div className="grid md:grid-cols-3 gap-4"><Metric title="Created opportunities" value={opps.length}/><Metric title="Applicants" value={apps.length}/><Metric title="Active posts" value={opps.filter(o=>o.status==="active").length}/></div></Shell>}
function ManageOpps(){const[opps,setOpps]=useStore("opportunities",[]);return <Shell role="organization"><List items={opps} render={o=><Card key={o.id}><h3 className="font-bold">{o.title}</h3><p className="muted">{o.status}</p><div className="flex flex-wrap gap-2 mt-3"><button className="btn-secondary" onClick={()=>setOpps(opps.map(x=>x.id===o.id?{...x,status:x.status==="archived"?"active":"archived"}:x))}>Archive/Restore</button><button className="btn-secondary" onClick={()=>confirm("Delete this opportunity?")&&setOpps(opps.filter(x=>x.id!==o.id))}>Delete</button></div></Card>} /></Shell>}
function CreateOpp(){const nav=useNavigate(),[opps,setOpps]=useStore("opportunities",[]);const[f,setF]=useState({title:"",category:"Community",location:"Cebu City",skill:"Coordination",date:"2026-07-01",volunteersNeeded:20,description:""});return <Shell role="organization"><Card><h2 className="text-2xl font-bold">Create opportunity</h2>{["title","category","location","skill","date","volunteersNeeded","description"].map(k=><input key={k} className="input mt-3" placeholder={k} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>) }<Button className="mt-4" disabled={!f.title} onClick={()=>{setOpps([{...f,id:uid("opp"),org:"Local Organization",status:"active",requirements:"Orientation required."},...opps]);nav("/organization/opportunities")}}>Publish opportunity</Button></Card></Shell>}
function Applicants(){const[apps,setApps]=useStore("applications",[]);return <Shell role="organization"><List items={apps} render={a=><Card key={a.id}><h3 className="font-bold">{a.volunteerName}</h3><p>{a.motivation}</p><p className="pill mt-2">{a.status}</p><div className="flex gap-2 mt-3">{["shortlisted","accepted","rejected"].map(s=><button key={s} className="btn-secondary" onClick={()=>setApps(apps.map(x=>x.id===a.id?{...x,status:s}:x))}>{s}</button>)}</div></Card>} empty="No applicants yet."/></Shell>}

function AdminDashboard(){const[users]=useStore("users",[]),[orgs]=useStore("organizations",[]),[reports]=useStore("reports",[]);return <Shell role="admin"><div className="grid md:grid-cols-3 gap-4"><Metric title="Users" value={users.length}/><Metric title="Organizations" value={orgs.length}/><Metric title="Open reports" value={reports.filter(r=>r.status==="open").length}/></div></Shell>}
function UsersAdmin(){const[users,setUsers]=useStore("users",[]);return <Shell role="admin"><List items={users} render={u=><Card key={u.id}><h3 className="font-bold">{u.name}</h3><p className="muted">{u.email} • {u.role}</p><button className="btn-secondary mt-3" onClick={()=>setUsers(users.map(x=>x.id===u.id?{...x,status:x.status==="suspended"?"active":"suspended"}:x))}>{u.status==="suspended"?"Activate":"Suspend"}</button></Card>} /></Shell>}
function OrgsAdmin(){const[orgs,setOrgs]=useStore("organizations",[]);return <Shell role="admin"><List items={orgs} render={o=><Card key={o.id}><h3 className="font-bold">{o.name}</h3><p>{o.description}</p><p className="pill mt-2">{o.status}</p><div className="flex gap-2 mt-3">{["approved","rejected"].map(s=><button key={s} className="btn-secondary" onClick={()=>setOrgs(orgs.map(x=>x.id===o.id?{...x,status:s}:x))}>{s}</button>)}</div></Card>} /></Shell>}
function ReportsAdmin(){const[reports,setReports]=useStore("reports",[]);return <Shell role="admin"><List items={reports} render={r=><Card key={r.id}><h3 className="font-bold">{r.title}</h3><p>{r.details}</p><p className="pill mt-2">{r.status}</p><div className="flex gap-2 mt-3">{["resolved","dismissed"].map(s=><button key={s} className="btn-secondary" onClick={()=>setReports(reports.map(x=>x.id===r.id?{...x,status:s}:x))}>{s}</button>)}</div></Card>} /></Shell>}
function Analytics(){const[opps]=useStore("opportunities",[]);return <Shell role="admin"><Card><h2 className="text-2xl font-bold">Analytics</h2><div className="mt-5 space-y-3">{[...new Set(opps.map(o=>o.category))].map(c=><div key={c}><div className="flex justify-between"><span>{c}</span><b>{opps.filter(o=>o.category===c).length}</b></div><div className="bar"><span style={{width:`${opps.filter(o=>o.category===c).length*12}%`}}/></div></div>)}</div></Card></Shell>}

function Metric({title,value}){return <Card><p className="muted">{title}</p><b className="text-4xl">{value}</b></Card>}
function Empty({text}){return <Card><p className="muted">{text}</p></Card>}
function List({items,render,empty="Nothing here yet."}){return <div className="grid md:grid-cols-2 gap-4">{items?.length?items.map(render):<Empty text={empty}/>}</div>}

export default function App(){useEffect(seed,[]);return <BrowserRouter><Routes><Route path="/" element={<Landing/>}/><Route path="/role" element={<Role/>}/><Route path="/signin" element={<SignIn/>}/><Route path="/signup" element={<SignUp/>}/><Route path="/forgot-password" element={<Forgot/>}/><Route path="/volunteer/dashboard" element={<VolunteerDashboard/>}/><Route path="/volunteer/discover" element={<Discover/>}/><Route path="/volunteer/opportunity/:id" element={<OpportunityDetail/>}/><Route path="/volunteer/apply/:id" element={<Apply/>}/><Route path="/volunteer/applications" element={<MyApplications/>}/><Route path="/volunteer/activity" element={<ActivityPage/>}/><Route path="/volunteer/saved" element={<Saved/>}/><Route path="/volunteer/messages" element={<Messages role="volunteer"/>}/><Route path="/volunteer/streak" element={<StreakPage/>}/><Route path="/volunteer/notifications" element={<Notifications/>}/><Route path="/volunteer/profile" element={<Profile role="volunteer"/>}/><Route path="/organization/dashboard" element={<OrgDashboard/>}/><Route path="/organization/opportunities" element={<ManageOpps/>}/><Route path="/organization/create" element={<CreateOpp/>}/><Route path="/organization/applicants" element={<Applicants/>}/><Route path="/organization/messages" element={<Messages role="organization"/>}/><Route path="/organization/profile" element={<Profile role="organization"/>}/><Route path="/admin/dashboard" element={<AdminDashboard/>}/><Route path="/admin/users" element={<UsersAdmin/>}/><Route path="/admin/organizations" element={<OrgsAdmin/>}/><Route path="/admin/reports" element={<ReportsAdmin/>}/><Route path="/admin/analytics" element={<Analytics/>}/><Route path="*" element={<Landing/>}/></Routes></BrowserRouter>}
