import {GoogleGenAI} from '@google/genai';

export type Mode='professional'|'rollers'|'wheels';
type InputImage={bytes:Buffer,mime:string};

const fidelity=`The uploaded vehicle is the immutable subject. Preserve exact make, model, generation, proportions, body shape, body kit, bumpers, hood, headlights, taillights, grille, mirrors, spoiler or wing, paint color, decals, trim, tint, exhaust, ride height and every visible modification. Preserve the wheels unless Wheels mode explicitly replaces them. Do not turn the car into a generic interpretation. Photorealism is mandatory. Avoid warped panels, duplicate parts, melted wheels, fake badges, impossible road contact, impossible reflections and nonsensical geometry.`;

function buildPrompt(mode:Mode,user:string|null,index=0){
  const extra=user?.trim()? `User direction: ${user.trim()}` : 'Make tasteful professional automotive-photography choices automatically.';
  if(mode==='professional') return `${fidelity}\nCreate image ${index+1} of a cohesive six-image professional automotive photoshoot. Vary camera position, focal-length feel, distance and composition while keeping one believable shoot identity. Use natural photographic lighting, reflections, shadows, lens behavior and realistic automotive color treatment. ${extra}`;
  if(mode==='rollers') return `${fidelity}\nCreate image ${index+1} of a cohesive six-image real rolling automotive photoshoot. Keep the car comparatively sharp, with physically believable directional motion blur in the road and environment and realistic wheel rotation. Maintain correct suspension, ride height, perspective, road position, tire contact, reflections and traffic geometry. ${extra}`;
  return `${fidelity}\nIMAGE 1 is the original car photograph. IMAGE 2 is the exact wheel reference. Preserve the original photograph's car body, paint, windows, lighting, environment, framing, camera position, shadows, crop and dimensions. Change ONLY the visible wheels and the tire fitment immediately required around them. Match the reference wheel design faithfully with correct diameter, perspective, brake visibility, depth, occlusion, reflections and contact shadows. The output must align exactly with the original for a before/after slider. ${extra}`;
}

async function createImage(model:string,mode:Mode,images:InputImage[],user:string|null,index=0){
  const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY!});
  const contents:any[]=[
    {text:buildPrompt(mode,user,index)},
    ...images.map(x=>({inlineData:{mimeType:x.mime,data:x.bytes.toString('base64')}}))
  ];
  const response:any=await ai.models.generateContent({
    model,
    contents,
    config:{
      responseModalities:['IMAGE'],
      responseFormat:{image:{imageSize:'2K'}}
    }
  } as any);
  const parts=response?.candidates?.[0]?.content?.parts||[];
  const imagePart=parts.find((part:any)=>!part?.thought&&part?.inlineData?.data);
  if(!imagePart?.inlineData?.data) throw new Error('IMAGE_PROVIDER_EMPTY_RESPONSE');
  return {
    bytes:Buffer.from(imagePart.inlineData.data,'base64'),
    mime:imagePart.inlineData.mimeType||'image/png'
  };
}

export async function generateImages(mode:Mode,images:InputImage[],user:string|null){
  const generationModel=process.env.GEMINI_GENERATION_MODEL||'gemini-3.1-flash-image';
  const editModel=process.env.GEMINI_EDIT_MODEL||'gemini-3-pro-image';
  if(mode==='wheels') return [await createImage(editModel,mode,images,user)];
  const outputs=[];
  for(let i=0;i<6;i++) outputs.push(await createImage(generationModel,mode,images,user,i));
  return outputs;
}
