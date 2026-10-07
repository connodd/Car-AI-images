import LegalDocument from '@/components/LegalDocument';
export default function Refund(){return <LegalDocument title="REFUND POLICY" sections={[
  {body:'Technical failures that do not produce a completed generation may be retried without another charge.'},
  {heading:'ONE-TIME GENERATIONS',body:'Successfully completed one-time generations are generally non-refundable because generation compute is consumed immediately.'},
  {heading:'UNLIMITED',body:'REVFRAME Unlimited can be canceled through the Stripe Customer Portal. Access and billing remain subject to the terms presented at checkout.'}
]}/>}
