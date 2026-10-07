import Results from '@/components/Results';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <main className="simple"><Results id={id}/></main>}
