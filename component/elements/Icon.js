import Image from "next/image";
import defaultIcon from "../../public/images/icon.png";

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

