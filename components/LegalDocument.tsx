export type LegalSection={heading?:string;body:string};
export default function LegalDocument({title,sections}:{title:string;sections:LegalSection[]}){return <main className="legal"><small>REVFRAME LEGAL</small><h1>{title}</h1>{sections.map((s,i)=><section key={`${s.heading||'section'}-${i}`}>{s.heading&&<h2>{s.heading}</h2>}<p>{s.body}</p></section>)}</main>}
