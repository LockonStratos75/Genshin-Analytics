
import ConnectHoyolab from "@/components/ConnectHoyolab";
import PasteWishURL from "@/components/PasteWishURL";
import TextMapUpload from "@/components/TextMapUpload";

export default function ConnectPage(){
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Connect Your Account</h1>
      <ConnectHoyolab />
      {/*<TextMapUpload />*/}
      <PasteWishURL />
    </div>
  );
}
