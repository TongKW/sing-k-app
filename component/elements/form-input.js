import React from 'react';

export default function FormInput(props) {
  return (
    <input 
      className={inputFormClass + (props.warning ? "border-red-500" : "")}
      id={props.id} type={props.type} placeholder={props.placeholder}
      onChange={(e) => {props.onChange(e.target.value)}}
    />
  )
}

// Tailwind classes definitions
// Text field for input form
const inputFormClass = "text-sm shadow border rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline";