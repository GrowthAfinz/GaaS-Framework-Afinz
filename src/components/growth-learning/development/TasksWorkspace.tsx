import React from 'react';
import {WorkHub} from './WorkHub';
export function readTaskView(search:string):'development'|'investigations'{const p=new URLSearchParams(search);return p.has('dev_task')?'development':p.get('task_view')==='investigations'||p.has('item')?'investigations':'development';}
export function TasksWorkspace({initialMonth}:{initialMonth:string}){return <WorkHub initialMonth={initialMonth}/>;}
