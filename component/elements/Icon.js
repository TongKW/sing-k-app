import Image from 'next/image'
import icon from '../../public/images/icon.png';

export default function Icon(props) {
  // default length => 150
  var length = props.length ? props.length : 150;
  return (
    <Image
      src={icon}
      alt="Karaoke App"
      width={length}
      height={length}
    />
  )
}