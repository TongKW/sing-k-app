import React, { useState, useEffect } from 'react';
import HomePage from '../component/wrapper/HomePage';

export default function ChangePassword() {
  return (
    <HomePage href='change-password'>
      <div className="flex-1 p-10 text-2xl font-bold">
        Change Password
      </div>
    </HomePage>
  )
}