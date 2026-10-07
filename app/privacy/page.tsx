import LegalDocument from '@/components/LegalDocument';
export default function Privacy(){return <LegalDocument title="PRIVACY" sections={[
  {body:'REVFRAME processes account information, payment metadata, uploaded vehicle images, generation instructions, and generated results to provide the service.'},
  {heading:'PAYMENTS',body:'Payment card details are handled by Stripe and are not stored by REVFRAME.'},
  {heading:'IMAGES',body:'User images are stored in private object storage and are served through time-limited signed URLs. Do not upload content you do not have the right to use.'},
  {heading:'ANALYTICS',body:'Product analytics may record actions such as mode selection, uploads, checkout, and generation status. REVFRAME does not send private image contents or generation prompt text to analytics.'}
]}/>}
