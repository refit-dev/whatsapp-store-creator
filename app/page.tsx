import { SmartHomepage } from "@/components/SmartHomepage";
import AuthRedirectHandler from "@/components/AuthRedirectHandler";

export default function Home() {
  return (
    <>
      <AuthRedirectHandler />
      <SmartHomepage />
    </>
  );
}
