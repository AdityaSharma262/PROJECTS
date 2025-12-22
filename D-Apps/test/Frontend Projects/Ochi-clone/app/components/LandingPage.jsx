import { easeIn, motion } from 'framer-motion';
import React from 'react'
import { MdArrowOutward } from "react-icons/md";

function LandingPage() {
  
  return (
    <div data-scroll data-scroll-section data-scroll-speed="-.3" className='w-full h-screen bg-slate-200 pt-2'>
      <div className='textstructure mt-40 px-14'>
      
      {["WE CREATE","EYE-OPENING","PRESENTATIONS"].map((item,index)=>{
        return <div className='masker'>
          <div className='w-fit flex'>
          
            {index===1 && (<motion.div initial={{width:0}} animate={{width:"128px"}} transition={{ease:[0.76, 0, 0.24, 1], duration:1.2}} className='mr-1 w-32 h-[9.7vh] rounded-md bg-black bg-cover overflow-hidden '> <img src="https://ochi.design/wp-content/uploads/2022/04/content-image01.jpg" alt="" /></motion.div>)}
        <h1 className='text-7xl tracking-tighter leading-[5vw] font-bold '>{item}</h1>
        
          </div>
          </div>
      })}
      </div>
      <div className='border-gray-400 mt-32 border-t-[1px] flex justify-between  font-light px-11 py-2 items-center'>
        {["For public and private companies","From the first pitch to IPO"].map((item,index)=>(
           <h8 className='text-base leading-none tracking-tighter' >{item}</h8>


        ))}

      <div className='start flex items-center gap-2 ml-3'>
        <div className='border-[1px] rounded-full px-3 py-1  border-fuchsia-500 font-light text-sm  '>START THE PROJECT</div>

        <div className='border-[1px] h-10 w-10 rounded-full  border-fuchsia-500 items-center justify-center flex'><MdArrowOutward /></div>
      </div>
      
        
      </div>

    
    </div>
  )
}

export default LandingPage