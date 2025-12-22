import React from "react";

function Cards() {
  return <div className="w-full h-screen flex gap-5 px-10">
    <div className="cardContainer w-full  h-[55vh]">
      <div className="w-full h-full bg-[#004d43] rounded-2xl relative  "> <h1 className="  absolute ml-48 mt-36 text-7xl font-semibold text-[#cdea68]">OCHi</h1>
      <div className="h-2 p-5 border-[#cdea68] border-2 mt-[300px] ml-10 absolute items-center justify-center flex rounded-full"><h1 className="text-[#cdea68]">@2019-2024</h1></div>
      </div>
      
      
    

      </div>
      <div className="cardContainer w-full h-[55vh] flex gap-5">
      <div className="w-1/2 h-full bg-[#212121] rounded-2xl items-center justify-center flex "> <img src="https://ochi.design/wp-content/uploads/2022/04/logo002.svg" alt="" /></div>
      <div className="w-1/2 h-full bg-[#212121] rounded-2xl items-center justify-center flex "> <img className="h-28" src="https://ochi.design/wp-content/uploads/2022/04/logo003.png" alt="" /></div>

      

    </div>
  </div>;
}

export default Cards;
