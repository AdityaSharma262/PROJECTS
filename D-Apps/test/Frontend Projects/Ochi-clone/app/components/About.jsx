import React from "react";

function About() {
  return (
    <div className="bg-[#cdea68] rounded-bl-3xl rounded-br-3xl ">
      <div className="w-full py-20   rounded-tl-3xl rounded-tr-3xl">
        <h1 className="text-4xl tracking-tighter leading-[4.2vw] px-20">
          Ochi is a strategic partner for fast-grow­ing tech businesses that
          need to raise funds, sell prod­ucts, ex­plain com­plex ideas, and hire
          great peo­ple.
        </h1>

        <div className="w-full border-t-[1px] border-slate-800 mt-16 flex justify-evenly font-light ">
          <div className="mt-4">What you can expect:</div>

          <div className="mt-4 w-80 ml-64">
            <div>
              We create tailored presentations to help you persuade your
              colleagues, clients, or investors. Whether it’s live or digital,
              delivered for one or a hundred people.
            </div>

            <div className="mt-5">
              We believe the mix of strategy and design (with a bit of coffee)
              is what makes your message clear, convincing, and captivating.
            </div>
          </div>
          <div className="mt-32 ">
            <ul>
              <li> Instagram</li>
              <li> Facebook</li>
              <li> Linkedin</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full border-t-[1px] border-slate-800 mt-5 flex  ">
        <div className="w-1/2 mt-6 px-10">
          <h1 className="text-5xl font-normal ">Our approach:</h1>
          <button className=" flex mt-5 gap-10 items-center px-5 py-4 bg-black text-white rounded-full">
            READ MORE
            <div className="h-2 w-2 bg-white rounded-full"> </div>
          </button>
        </div>
        <div className="w-[75vh] h-[60vh] bg-red-400 mt-6 rounded-3xl overflow-hidden mb-10 "> <img src="https://ochi.design/wp-content/uploads/2022/05/Homepage-Photo-663x469.jpg"className="object-cover w-full h-full"/></div>
      </div>
    </div>
  );
}

export default About;
