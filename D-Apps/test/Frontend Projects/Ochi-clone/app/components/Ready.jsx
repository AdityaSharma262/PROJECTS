"use client"
import React, { useEffect, useState } from "react";

function Ready() {

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
    <div className='w-full h-screen relative'>
        <div className='w-full h-full bg-[#cdea68] rounded-tl-3xl rounded-tr-3xl'>
            <div className='pt-20'>
            <h1 className='tracking-tighter  text-[24vh] font-extrabold ml-[60vh]'> READY</h1>
            <h1 className='tracking-tighter text-[24vh] font-extrabold ml-[40vh] leading-6'> TO START</h1>
            <h1 className='tracking-tighter text-[22vh] font-extrabold ml-[25vh]'> THE PROJECT?</h1>
            </div>
        </div>

        <div className="absolute  gap-10 flex  top-1/2 left-1/2 -translate-x-[50%] -translate-y-[50%]">
          <div className="h-[12vw] w-[12vw] bg-white rounded-full items-center justify-center flex">
            <div className="relative h-2/3 w-2/3 bg-black rounded-full text-white items-center justify-center flex">PLAY
              <div
                style={{
                  transform: `translate(-50%,-50%) rotate(${rotate}deg)`,
                }}
                className="line   w-full h-8 absolute top-1/2 left-1/2 -translate-x-[50%] -translate-y-[50%]"
              >
                <div className="h-6 w-6 bg-[#cdea68] rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="h-[12vw] w-[12vw] bg-white rounded-full items-center justify-center flex">
            <div className="h-2/3 w-2/3 bg-black rounded-full relative  text-white items-center justify-center flex">PLAY
              <div
                style={{
                  transform: `translate(-50%,-50%) rotate(${rotate}deg)`,
                }}
                className="line  w-full h-8bg-red-400 absolute top-1/2 left-1/2 -translate-x-[50%] -translate-y-[50%]"
              >
                <div className="h-6 w-6 bg-[#cdea68] rounded-full"></div>
              </div>
            </div>
          </div>

         
         
         
          </div >

        


    </div >
  )
}
export default Ready