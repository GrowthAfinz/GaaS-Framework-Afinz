import {useLayoutEffect,useState,type RefObject} from 'react';
/** Measure physical viewport space; CSS zoom and browser fullscreen use different coordinate systems. */
export function useJourneyWorkspaceSize(root:RefObject<HTMLElement>,header:RefObject<HTMLElement>,flow:boolean,fullscreen:boolean){
 const [size,setSize]=useState({height:800,canvasMin:440});
 useLayoutEffect(()=>{if(!flow)return;let frame=0;
 const measure=()=>{const el=root.current;if(!el||!el.offsetWidth)return;const rect=el.getBoundingClientRect(),ratio=Math.max(.25,Math.min(2,rect.width/el.offsetWidth||1));
 const available=fullscreen?window.innerHeight:Math.max(300,window.innerHeight-Math.max(0,rect.top)-12),head=header.current?.getBoundingClientRect().height||180;
 const minCanvas=fullscreen?Math.max(220,available-head-80):440;
 const height=(fullscreen?available:Math.max(available,head+minCanvas+80))/ratio,canvasMin=minCanvas/ratio;
 setSize(old=>Math.abs(old.height-height)<1&&Math.abs(old.canvasMin-canvasMin)<1?old:{height,canvasMin});};
 const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
 const observer=new ResizeObserver(schedule);if(header.current)observer.observe(header.current);if(root.current)observer.observe(root.current);
 window.addEventListener('resize',schedule);document.addEventListener('fullscreenchange',schedule);schedule();
 return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule);document.removeEventListener('fullscreenchange',schedule);};
 },[flow,fullscreen]);
 return size;
}
