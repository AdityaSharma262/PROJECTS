import { motion, useAnimation } from "framer-motion";
import React from "react";

function Featured() {
  const cards = [useAnimation(), useAnimation(),useAnimation(),useAnimation()];

  const handleHover = (index) => {
    cards[index].start({ y: "0" });
  };

  const handleHoverEnd = (index) => {
    cards[index].start({ y: "100%" });
  };

  

  return (
    <div className="w-full  py-20">
      <div className="w-full bg-white py-16 border-b-[1px]  border-gray-500 pb-10">
        <h1 className="text-6xl px-12 tracking-tighter">Featured projects</h1>
      </div>

      <div className="py-10">
        <div className="cards w-full mt-10  flex gap-10 px-10 relative ">





          <motion.div onHoverStart={() => handleHover(3)}
            onHoverEnd={() => handleHoverEnd(3)} className="class-container cursor-pointer w-1/2 h-[75vh] ">
            <div className="card w-full h-full rounded-xl overflow-hidden ">
              <h1 className=" overflow-hidden absolute translate-x-[75vh] tracking-tighter -translate-y-1/2 top-1/2 Z-[9]  text-8xl font-bold text-[#cdea68] ">
                {"FYDE".split("").map((item, index) => (
                  <motion.span
                  initial={{ y: "100%" }}
                  animate={cards[3]}
                  className="inline-block"
                >
                  {item}
                </motion.span>
                ))}
              </h1>
              <img
                className="bg-cover h-full w-full"
                src="https://ochi.design/wp-content/uploads/2023/10/Fyde_Illustration_Crypto_2-663x551.png"
                alt=""
              />
            </div>
          </motion.div>



          <motion.div onHoverStart={() => handleHover(2)}
            onHoverEnd={() => handleHoverEnd(2)} className=" cursor-pointer class-container w-1/2 h-[75vh]  ">
            <div className="card w-full h-full rounded-xl overflow-hidden ">
              <h1 className=" overflow-hidden absolute -translate-x-[20vh] tracking-tighter -translate-y-1/2 top-1/2 Z-[9]  text-8xl font-bold text-[#cdea68] ">
                {"VISE".split("").map((item, index) => (
                  <motion.span
                  initial={{ y: "100%" }}
                  animate={cards[2]}
                  className="inline-block"
                >
                  {item}
                </motion.span>
                ))}
              </h1>
              <img
                className="bg-cover h-full w-full"
                src="https://ochi.design/wp-content/uploads/2022/09/Vise_front2-663x551.jpg"
                alt=""
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* 2BOXXXXXXX */}

      <div className="py-10">
        <div className="cards w-full mt-10  flex gap-10 px-10 relative ">


          <motion.div
            onHoverStart={() => handleHover(0)}
            onHoverEnd={() => handleHoverEnd(0)}
            className="class-container cursor-pointer w-1/2 h-[75vh] "
          >
            <div className="card w-full h-full rounded-xl overflow-hidden ">
              <h1 className="absolute translate-x-[65vh] tracking-tighter -translate-y-1/2 top-1/2 Z-[9] overflow-hidden text-8xl font-bold text-[#cdea68] ">
                {"TRAWA".split("").map((item, index) => (
                  <motion.span
                    initial={{ y: "100%" }}
                    animate={cards[0]}
                    className="inline-block"
                  >
                    {item}
                  </motion.span>
                ))}
              </h1>
              <img
                className="bg-cover h-full w-full"
                src="https://ochi.design/wp-content/uploads/2023/08/Frame-3875-663x551.jpg"
                alt=""
              />
            </div>
          </motion.div>

          <motion.div
            onHoverStart={() => handleHover(1)}
            onHoverEnd={() => handleHoverEnd(1)}
            className="class-container cursor-pointer w-1/2 h-[75vh]  "
          >
            <div className="card w-full h-full rounded-xl overflow-hidden ">
              <h1 className="absolute -translate-x-[40vh] -translate-y-1/2 top-1/2 Z-[9] overflow-hidden tracking-tighter text-7xl font-bold text-[#cdea68] ">
                {"PREMIUM BLEND".split("").map((item, index) => (
                  <motion.span
                    initial={{ y: "100%" }}
                    animate={cards[1]}
                    className="inline-block"
                  >
                    {item}
                  </motion.span>
                ))}
              </h1>
              <img
                className="bg-cover h-full w-full"
                src="https://ochi.design/wp-content/uploads/2022/12/PB-Front-4-663x551.png"
                alt=""
              />
            </div>
          </motion.div>

          
        </div>
      </div>

      <div className="mt-10 w-full  items-center justify-center flex">
        <button className="bg-black text-white tracking-tighter px-7 py-4 rounded-full text-sm flex items-center gap-10 ">
          VIEW ALL CASE STUDIES{" "}
          <div className="h-2 w-2 bg-white rounded-full"></div>
        </button>
      </div>
    </div>
  );
}

export default Featured;
