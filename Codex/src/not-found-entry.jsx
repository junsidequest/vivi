import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import Professional from './Professional.jsx'
import './fonts.css'
import './professional.css'
import './style.css'
import './ui/ui.css'
import './ui/pixel.css'
import './mobile-type.css'

function Destination(){
  useEffect(()=>{
    requestAnimationFrame(()=>window.dispatchEvent(new Event('vivi-404-ready')))
  },[])
  return <Professional/>
}

createRoot(document.getElementById('destination')).render(<Destination/>)
