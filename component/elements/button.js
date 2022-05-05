import React from "react";

// a generic button component that renders the button with onclick event listener
export default function Button(props) {
  return (
    <div onClick={props.onClick ? props.onClick : undefined}>
      <button
        className="bg-indigo-700 hover:bg-indigo-800 text-white py-2 px-4 text-xs rounded focus:outline-none focus:shadow-outline"
        type="button"
      >
        {props.text}
      </button>
    </div>
  );
}
