import { logoImage } from "@/lib/logo-image";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return logoImage(size);
}
