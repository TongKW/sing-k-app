import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import HomePage from "../../component/wrapper/HomePage";

export default function ViewProfile(){
    const router = useRouter();
    const userid = router.query.id;
}