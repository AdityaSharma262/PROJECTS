"use client";
import React, { useEffect, useState } from "react";

function Eyes() {
  const [rotate, setrotate] = useState(0);

  useEffect(() => {
    window.addEventListener("mousemove", (e) => {
      let mouseX = e.clientX;
      let mouseY = e.clientY;

      let deltaX = mouseX - window.innerWidth / 2;
      let deltaY = mouseY - window.innerHeight / 2;

      var angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

      setrotate(angle - 180);
    });
  });

  return (
    <div className="w-full h-screen overflow-hidden">
      <div data-scroll  data-scroll-speed="-.7" className='relative w-full h-full bg-cover bg-center bg-[url("https://ochi.design/wp-content/uploads/2022/05/Top-Viewbbcbv-1-1440x921.jpg")]'>
        <div className="absolute  gap-10 flex  top-1/2 left-1/2 -translate-x-[50%] -translate-y-[50%]">
          <div className="h-[15vw] w-[15vw] bg-white rounded-full items-center justify-center flex">
            <div className="relative h-2/3 w-2/3 bg-black rounded-full text-white items-center justify-center flex">PLAY
              <div
                style={{
                  transform: `translate(-50%,-50%) rotate(${rotate}deg)`,
                }}
                className="line   w-full h-8 absolute top-1/2 left-1/2 -translate-x-[50%] -translate-y-[50%]"
              >
                <div className="h-8 w-8 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="h-[15vw] w-[15vw] bg-white rounded-full items-center justify-center flex">
            <div className="h-2/3 w-2/3 bg-black rounded-full relative  text-white items-center justify-center flex">PLAY
              <div
                style={{
                  transform: `translate(-50%,-50%) rotate(${rotate}deg)`,
                }}
                className="line  w-full h-8bg-red-400 absolute top-1/2 left-1/2 -translate-x-[50%] -translate-y-[50%]"
              >
                <div className="h-8 w-8 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Eyes;
