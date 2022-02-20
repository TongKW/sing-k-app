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

// Input Form block
export function FormInputBlock(props) {
  var category = props.category;
  var onChange = props.onChange ? props.onChange : ()=>{};
  var isPassword = false;
  if (category === 'password' || category === 'repeat password') {
    isPassword = true;
  }

  return (
    <div className="mb-4 text-gray-700">
      <FormInput id={category} type={isPassword ? 'password' : 'text'} placeholder={category.charAt(0).toUpperCase() + category.slice(1)} onChange={onChange} warning={props.warning}></FormInput>
      <p style={{display:`${props.warning ? 'block' : 'none'}`}} className="text-red-700 text-xs italic mt-3">{props.warning}</p>
    </div>
  )
}

// Tailwind classes definitions
// Text field for input form
const inputFormClass = "text-sm shadow border rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ";