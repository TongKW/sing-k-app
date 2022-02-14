import React from 'react';
import { inputFormClass } from '../../styles/tailwindClasses';

export default function FormInput(props) {
  return (
    <input 
      className={inputFormClass + (props.warning ? "border-red-500" : "")}
      id={props.id} type={props.type} placeholder={props.placeholder}
      onChange={(e) => {props.onChange(e.target.value)}}
    />
  )
}