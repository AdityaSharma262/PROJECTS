"use client"
import React from 'react'

import Navbar from './components/Navbar'
import  LandingPage from "./components/LandingPage";
import Markie from "./components/Markie";
import About from "./components/About";
import Eyes from "./components/Eyes";
import Featured from "./components/Featured"
import Cards from "./components/Cards"
import Ready from "./components/Ready"
import Footer from "./components/Footer"
import LocomotiveScroll from 'locomotive-scroll';

function page() {
  

const locomotiveScroll = new LocomotiveScroll();


  return (
    <div className=' w-full h-screen bg-slate-200'>
      <Navbar/>
      <LandingPage/>
      <Markie/>
      <About/>
      <Eyes/>
      <Featured/>
      <Cards/>
      <Ready/>
      <Footer/>

      
       </div>
  )
}

export default page