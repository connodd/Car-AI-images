import {GoogleGenAI} from '@google/genai';

export type Mode='professional'|'rollers'|'wheels';
type InputImage={bytes:Buffer,mime:string};

const fidelity=`The uploaded vehicle is the immutable subject. Preserve exact make, model, generation, proportions, body shape, body kit, bumpers, hood, headlights, taillights, grille, mirrors, spoiler or wing, paint color, decals, trim, tint, exhaust, ride height and every visible modification. Preserve the wheels unless Wheels mode explicitly replaces them. Do not turn the car into a generic interpretation. Photorealism is mandatory. Avoid warped panels, duplicate parts, melted wheels, fake badges, impossible road contact, impossible reflections and nonsensical geometry.`;

function buildPrompt(mode:Mode,user:string|null,index=0){
  const extra=user?.trim()? `User direction: ${user.trim()}` : 'Make tasteful professional automotive-photography choices automatically.';
  if(mode==='professional') return `${fidelity}\nCreate image ${index+1} of a cohesive six-image professional automotive photoshoot. Vary camera position, focal-length feel, distance and composition while keeping one believable shoot identity. Use natural photographic lighting, reflections, shadows and lens behavior. ${extra}`;
  if(mode==='rollers') return `${fidelity}\nCreate image ${index+1} of a cohesive six-image real rolling automotive photoshoot. Keep the car comparatively sharp, with physically believable directional motion blur in the road and environment and realistic wheel rotation. Maintain correct suspension, ride height, perspective, road position, tire contact, reflections and traffic geometry. ${extra}`;
  return `${fidelity}\nIMAGE 1 is the original car photograph. IMAGE 2 is the exact wheel reference. Preserve the original photograph's car body, paint, windows, lighting, environment, framing, camera position, shadows, crop and dimensions. Change ONLY the visible wheels and the tire fitment immediately required around them. Match the reference wheel design faithfully with correct diameter, perspective, brake visibility, depth, occlusion, reflections and contact shadows. The output must align with the original for a before/after slider. ${extra}`;
}

async function createImage(model:string,mode:Mode,images:InputImage[],user:string|null,index=0){
  const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY!});
  const input:any[]=[{type:'text',text:buildPrompt(mode,user,index)},...images.map(x=>({type:'image',mime_type:x.mime,data:x.bytes.toString('base64')}))];
  const interaction:any=await ai.interactions.create({
    model,
    input,
    response_format:{type:'image',mime_type:'image/png',image_size:'2K'}
  } as any);
  if(!interaction?.output_image?.data) throw new Error('IMAGE_PROVIDER_EMPTY_RESPONSE');
  return {bytes:Buffer.from(interaction.output_image.data,'base64'),mime:interaction.output_image.mime_type||'image/png'};
}

export async function generateImages(mode:Mode,images:InputImage[],user:string|null){
  if(mode==='wheels') return [await createImage(process.env.GEMINI_EDIT_MODEL||'gemini-3-pro-image',mode,images,user)];
  return Promise.all(Array.from({length:6},(_,i)=>createImage(process.env.GEMINI_GENERATION_MODEL||'gemini-nano-banana-2.1',mode,images,user,i)));
}
