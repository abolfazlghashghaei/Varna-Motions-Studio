export type Host = 'ae' | 'premiere' | 'resolve';
export type Workspace = {host:'ae';editor:true} | {host:'premiere'|'resolve';editor:false};
export type JobState = 'submitting'|'queued'|'running'|'reconnecting'|'transferring'|'completed'|'failed'|'lost'|'cancelled'|'cancellation_requested';
export interface JobStatus {id:string;promptId?:string;clientId:string;state:JobState;progress?:{value:number;max:number}|null;updated:number}
export interface HostBridge {readonly host:Host;sequence():Promise<{width:number;height:number;fps:number;time:number}>;placeGraphic(file:string,videoTrack:number,time:number):Promise<void>}
export const workspace=(host:Host):Workspace=>host==='ae'?{host,editor:true}:{host,editor:false};
