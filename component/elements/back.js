import React from "react";
import Link from "next/link";

// A wrapper of back button to go back to previous page (change hash)
export default function Back(props) {
  return (
    <div className="flex items-center justify-between pb-2">
      <Link href={props.href}>
        <a className="inline-block align-baseline text-sm text-indigo-700 hover:text-indigo-800">
          ← back
        </a>
      </Link>
    </div>
  );
}
