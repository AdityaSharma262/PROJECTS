"use client";
import { motion } from "framer-motion";
import React from "react";

function markie() {
  return (
    <div data-scroll data-scroll-section data-scroll-speed=".1" className="w-full py-20 bg-[#004d43] rounded-tl-3xl rounded-tr-3xl">
      <div className="border-t-[1px] border-b-[1px]  border-[#2b776d] flex leading-none whitespace-nowrap overflow-hidden  text-white">
        <motion.h1
          initial={{ x: 0 }}
          animate={{ x: "-100%" }}
          transition={{ ease: "linear", repeat: Infinity, duration: 10 }}
          className="text-[40vh] font-bold tracking-tighter leading-none mr-10"
        >
          WE ARE OCHE
        </motion.h1>

        <motion.h1
          initial={{ x: 0 }}
          animate={{ x: "-100%" }}
          transition={{ ease: "linear", repeat: Infinity, duration: 10 }}
          className="text-[40vh] font-bold tracking-tighter leading-none "
        >
          WE ARE OCHE
        </motion.h1>

        <motion.h1
          initial={{ x: 0 }}
          animate={{ x: "-100%" }}
          transition={{ ease: "linear", repeat: Infinity, duration: 10 }}
          className="text-[40vh] font-bold tracking-tighter leading-none "
        >
          WE ARE OCHE
        </motion.h1>
      </div>
    </div>
  );
}

export default markie;
