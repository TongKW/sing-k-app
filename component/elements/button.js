import React from 'react';

export default function Button(props) {
  return (
    <button 
      className="bg-indigo-700 hover:bg-indigo-800 text-white py-2 px-4 text-xs rounded focus:outline-none focus:shadow-outline" 
      type="button">
      {props.text}
    </button>
  )
}