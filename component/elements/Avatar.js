import Image from 'next/image'

/**
 * Transfer base64 encoding to Next Image 
 * @param {string} encoding - Base64 encoding of Avatar image
 * @return {JSX} - Next image JSX element
 */
export default function Avatar(props) {
  // default length => 150
  var length = props.length ? props.length : 150;
  return (
    <Image
      src={`data:image/jpeg;base64,${props.encoding}`}
      alt="Avatar"
      width={length}
      height={length}
    />
  )
}