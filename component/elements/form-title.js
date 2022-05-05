import React from "react";

// This component renders the label of the form
export default function FormTitle(props) {
  return (
    <label
      className="block text-white text-sm font-bold mb-2"
      htmlFor={props.title}
    >
      {props.title.charAt(0).toUpperCase() + props.title.slice(1)}
    </label>
  );
}
