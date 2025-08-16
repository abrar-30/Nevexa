
"use client";
import { useState } from "react";
import { Navbar } from "@/components/navbar";


export default function SettingsPage() {
  
  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
    </>
  );
}