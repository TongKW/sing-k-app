import React from "react";

export default function FromTitle(props) {
  return (
    <label className="block text-white text-sm font-bold mb-2" htmlFor={props.title}>
      {props.title.charAt(0).toUpperCase() + props.title.slice(1)}
    </label>
  );
}