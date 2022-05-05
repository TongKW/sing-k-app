import Image from "next/image";
import defaultIcon from "../../public/images/icon.png";

// This component returns a generic icon class with the image input as icon, and leave flexibility of
// other user defined properties like onClick event listener all in the ...style
export default function Icon({ length, alt, icon, ...style }) {
  const defaultLength = 150;
  const iconSource = icon ?? defaultIcon;
  const iconLength = length ?? defaultLength;
  const iconAlt = alt ?? "Karaoke App";
  return (
    <div {...style}>
      <Image
        src={iconSource}
        alt={iconAlt}
        width={iconLength}
        height={iconLength}
      />
    </div>
  );
}
